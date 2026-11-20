import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, ShieldCheck, LoaderCircle, CreditCard } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import type { CartItem } from '../../types';

interface CheckoutAddress {
  fullName: string; phone: string; addressLine1: string; addressLine2: string;
  city: string; state: string; postalCode: string; country: string;
}
export interface SavedAddressOption { _id: string; label: string; fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string; country: string; isDefault: boolean }
export interface OrderRecord {
  _id: string; total: number; subtotal: number; discount: number; shippingFee: number;
  paymentMethod: 'cod' | 'razorpay'; paymentStatus: string; orderStatus: string;
  createdAt?: string; items: Array<{ productName: string; quantity: number; unitPrice: number; imageUrl?: string; size: string; color: string }>;
  shippingAddress: CheckoutAddress;
}
interface RazorpayOrder { keyId: string; razorpayOrderId: string; amount: number; currency: string; orderId: string }
interface RazorpaySuccess { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, callback: (response: unknown) => void) => void } } }

const initialAddress: CheckoutAddress = { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India' };
const fieldClass = 'w-full rounded-xl border border-[#7E7C77]/25 bg-[#FFFCF7] px-4 py-3 text-sm text-[#2E2D2B] outline-none transition focus:border-[#6B7B6E] focus:ring-2 focus:ring-[#6B7B6E]/15';
async function loadRazorpayScript() {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay)); script.onerror = () => resolve(false); document.body.appendChild(script);
  });
}

export function CheckoutDialog({ items, subtotal, couponCode, onClose, onComplete }: {
  items: CartItem[]; subtotal: number; couponCode: string | null; onClose: () => void; onComplete: (order: OrderRecord) => void;
}) {
  const { showToast } = useToast();
  const [address, setAddress] = useState(initialAddress);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const keyRef = useRef<string | null>(null);
  const fingerprintRef = useRef('');
  const addressTouchedRef = useRef(false);
  useEffect(() => {
    let active = true;
    void api.get<{ addresses: SavedAddressOption[] }>('/addresses').then((result) => {
      if (!active) return;
      const list = result.addresses ?? []; setSavedAddresses(list);
      const preferred = list.find((item) => item.isDefault) ?? list[0];
      if (preferred && !addressTouchedRef.current) { setSelectedAddressId(preferred._id); setAddress({ fullName: preferred.fullName, phone: preferred.phone, addressLine1: preferred.addressLine1, addressLine2: preferred.addressLine2 ?? '', city: preferred.city, state: preferred.state, postalCode: preferred.postalCode, country: preferred.country }); }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // If an order was already created on the server (and the server cart was
  // cleared), reflect that state instead of pretending checkout never
  // happened. Otherwise simply close the dialog.
  const closeDialog = () => { if (order) onComplete(order); else onClose(); };
  const updateAddress = (key: keyof CheckoutAddress, value: string) => {
    if (order) return;
    addressTouchedRef.current = true;
    setSelectedAddressId('');
    setAddress((current) => ({ ...current, [key]: value }));
  };
  const chooseSavedAddress = (id: string) => {
    if (order) return;
    addressTouchedRef.current = true;
    setSelectedAddressId(id);
    const saved = savedAddresses.find((item) => item._id === id);
    if (saved) setAddress({ fullName: saved.fullName, phone: saved.phone, addressLine1: saved.addressLine1, addressLine2: saved.addressLine2 ?? '', city: saved.city, state: saved.state, postalCode: saved.postalCode, country: saved.country });
    else setAddress(initialAddress);
  };

  const startRazorpay = async (existingOrder: OrderRecord) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) throw new Error('Razorpay checkout could not load. Check your internet connection and try again.');
    const checkout = await api.post<RazorpayOrder>('/payments/orders', { orderId: existingOrder._id });
    const RazorpayConstructor = window.Razorpay;
    await new Promise<void>((resolve, reject) => {
      const instance = new RazorpayConstructor({
        key: checkout.keyId, amount: checkout.amount, currency: checkout.currency, name: 'NEXTO', description: 'NEXTO order payment', order_id: checkout.razorpayOrderId,
        prefill: { name: address.fullName, contact: address.phone }, theme: { color: '#526457' },
        handler: async (response: RazorpaySuccess) => {
          try {
            const verified = await api.post<{ paymentStatus: string }>('/payments/verify', response as RazorpaySuccess);
            showToast('Payment verified successfully.');
            onComplete({ ...existingOrder, paymentStatus: verified.paymentStatus }); resolve();
          } catch (error) { reject(error); }
        },
        modal: { ondismiss: () => resolve() },
      });
      instance.on('payment.failed', (response: unknown) => {
        const detail = response as { error?: { description?: string } };
        reject(new Error(detail.error?.description || 'Payment failed. You can retry this payment.'));
      });
      instance.open();
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true);
    try {
      const payload = { shippingAddress: { ...address, addressLine2: address.addressLine2.trim() }, paymentMethod, ...(couponCode ? { couponCode } : {}) };
      const fingerprint = JSON.stringify(payload);
      if (fingerprint !== fingerprintRef.current) { keyRef.current = null; fingerprintRef.current = fingerprint; }
      if (!keyRef.current) keyRef.current = crypto.randomUUID();
      let currentOrder = order;
      if (!currentOrder) {
        const result = await api.post<{ order: OrderRecord }>('/orders', payload, { headers: { 'Idempotency-Key': keyRef.current } });
        currentOrder = result.order; setOrder(currentOrder);
      }
      if (paymentMethod === 'cod') { onComplete(currentOrder); return; }
      await startRazorpay(currentOrder);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#211f1b]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-[#7E7C77]/20 bg-[#F9F6F0] p-5 shadow-2xl sm:rounded-3xl sm:p-8">
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-[#7E7C77]/20 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6B7B6E]">Secure checkout</p><h2 id="checkout-title" className="mt-1 font-serif text-3xl text-[#2E2D2B]">Delivery details</h2><p className="mt-1 text-xs text-[#7E7C77]">{items.length} item types · ₹{subtotal.toLocaleString('en-IN')} subtotal</p></div><button type="button" onClick={closeDialog} aria-label="Close checkout" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#7E7C77]/20 bg-[#FFFCF7] text-[#2E2D2B] hover:bg-[#F0EBE2]"><X size={18}/></button></header>
      <form onSubmit={submit} className="space-y-6">
        {order && paymentMethod === 'razorpay' && <p className="rounded-xl border border-[#6B7B6E]/25 bg-[#E8EDE6]/70 p-3 text-xs leading-5 text-[#405345]">Your order has been created and inventory reserved. Delivery details are locked while you retry payment for this same order.</p>}
        {savedAddresses.length > 0 && <label className="block space-y-1.5 text-xs font-semibold text-[#2E2D2B]">Use a saved address<select value={selectedAddressId} disabled={Boolean(order)} onChange={(event) => chooseSavedAddress(event.target.value)} className={fieldClass}><option value="">Enter a different address</option>{savedAddresses.map((saved) => <option key={saved._id} value={saved._id}>{saved.label} · {saved.city} {saved.isDefault ? '(Default)' : ''}</option>)}</select></label>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B]">Full name<input required minLength={2} maxLength={100} autoComplete="name" value={address.fullName} disabled={Boolean(order)} onChange={(e) => updateAddress('fullName', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B]">Phone number<input required pattern="\+?[0-9]{10,15}" title="Enter 10–15 digits, optionally beginning with +" autoComplete="tel" value={address.phone} disabled={Boolean(order)} onChange={(e) => updateAddress('phone', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B] sm:col-span-2">Address line 1<input required minLength={5} maxLength={200} autoComplete="address-line1" value={address.addressLine1} disabled={Boolean(order)} onChange={(e) => updateAddress('addressLine1', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B] sm:col-span-2">Address line 2 (optional)<input maxLength={200} autoComplete="address-line2" value={address.addressLine2} disabled={Boolean(order)} onChange={(e) => updateAddress('addressLine2', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B]">City<input required minLength={2} maxLength={100} autoComplete="address-level2" value={address.city} disabled={Boolean(order)} onChange={(e) => updateAddress('city', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B]">State<input required minLength={2} maxLength={100} autoComplete="address-level1" value={address.state} disabled={Boolean(order)} onChange={(e) => updateAddress('state', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B]">PIN / postal code<input required minLength={4} maxLength={12} autoComplete="postal-code" value={address.postalCode} disabled={Boolean(order)} onChange={(e) => updateAddress('postalCode', e.target.value)} className={fieldClass}/></label>
          <label className="space-y-1.5 text-xs font-semibold text-[#2E2D2B]">Country<input required minLength={2} maxLength={100} autoComplete="country-name" value={address.country} disabled={Boolean(order)} onChange={(e) => updateAddress('country', e.target.value)} className={fieldClass}/></label>
        </div>
        <fieldset className="space-y-3"><legend className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-[#2E2D2B]">Payment method</legend>
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${paymentMethod === 'cod' ? 'border-[#526457] bg-[#E8EDE6]/70' : 'border-[#7E7C77]/20 bg-[#FFFCF7]'}`}><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} disabled={Boolean(order)} onChange={() => { setPaymentMethod('cod'); setOrder(null); }} className="mt-1 accent-[#526457]"/><span className="flex-1"><span className="block text-sm font-bold text-[#2E2D2B]">Cash on delivery</span><span className="mt-1 block text-xs text-[#7E7C77]">Pay when your order arrives.</span></span></label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${paymentMethod === 'razorpay' ? 'border-[#526457] bg-[#E8EDE6]/70' : 'border-[#7E7C77]/20 bg-[#FFFCF7]'}`}><input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} disabled={Boolean(order)} onChange={() => { setPaymentMethod('razorpay'); setOrder(null); }} className="mt-1 accent-[#526457]"/><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F0EBE2] text-[#526457]"><CreditCard size={18}/></span><span className="flex-1"><span className="block text-sm font-bold text-[#2E2D2B]">Pay online with Razorpay</span><span className="mt-1 block text-xs text-[#7E7C77]">UPI, cards and supported payment methods.</span></span></label>
        </fieldset>
        <div className="flex items-start gap-2 rounded-xl bg-[#FFFCF7] p-3 text-[11px] leading-5 text-[#7E7C77]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#526457]"/> Your order total and stock are recalculated by the server. The amount shown in the cart is an estimate until checkout confirms the order.</div>
        <Button type="submit" size="lg" className="w-full rounded-full !py-4" disabled={submitting}>{submitting ? <><LoaderCircle size={16} className="animate-spin"/> Processing securely…</> : paymentMethod === 'cod' ? 'Place cash-on-delivery order' : 'Continue to secure payment'}</Button>
      </form>
    </section>
  </div>;
}
