import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, PackageCheck, ShoppingBag } from 'lucide-react';
import { ButtonLink } from '../../components/common/Button';
import { formatPrice } from '../../utils/format';
import { ROUTES } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api } from '../../services/api';
import type { OrderRecord } from '../../features/checkout/CheckoutDialog';
import { OrderConfirmationSkeleton } from '../../components/common/Skeleton';

export function OrderConfirmationPage() {
  usePageTitle('Order Details');
  const location = useLocation();
  const passedOrder = (location.state as { order?: OrderRecord } | null)?.order ?? null;
  const orderId = new URLSearchParams(location.search).get('orderId');
  const [fetchedOrder, setFetchedOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId && !passedOrder));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (passedOrder) { setFetchedOrder(null); setLoading(false); setFailed(false); return; }
    if (!orderId) { setLoading(false); setFailed(false); return; }
    let active = true;
    setLoading(true); setFailed(false);
    void api.get<{ order: OrderRecord }>(`/orders/${encodeURIComponent(orderId)}`).then((result) => {
      if (active) setFetchedOrder(result.order);
    }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId, passedOrder]);

  const order = passedOrder ?? fetchedOrder;
  if (loading) return <OrderConfirmationSkeleton />;
  if (!order) return <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F0EBE2] text-[#526457]"><PackageCheck size={28}/></span><h1 className="mt-5 font-serif text-4xl text-[#2E2D2B]">No order selected</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7E7C77]">{failed ? 'We could not load that order. Sign in and open it from your account to try again.' : 'Your order details will appear here after checkout. You can also open a previous order from My Account.'}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><ButtonLink to={ROUTES.account}>My account</ButtonLink><ButtonLink to={ROUTES.newArrivals} variant="ghost">Continue shopping</ButtonLink></div></section>;

  const isPaid = ['paid', 'captured', 'succeeded'].includes(order.paymentStatus.toLowerCase());
  const isCod = order.paymentMethod === 'cod';
  return <section className="mx-auto max-w-5xl space-y-7 px-4 py-10 sm:px-6 sm:py-16">
    <div className="rounded-3xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-6 text-center shadow-sm sm:p-12"><div className="mx-auto grid size-16 place-items-center rounded-full bg-[#E8EDE6] text-[#526457]"><Check size={28}/></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#6B7B6E]">NEXTO · ORDER {order.orderStatus.replace(/_/g, ' ').toUpperCase()}</p><h1 className="mt-2 font-serif text-4xl text-[#2E2D2B] sm:text-5xl">{isCod || isPaid ? 'Thank you for your order.' : 'Your order is reserved.'}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#7E7C77]">{isCod ? 'Your order has been saved. Pay when it arrives.' : isPaid ? 'Your payment has been verified and your order is confirmed.' : 'Your order exists, but payment is not yet confirmed. You can check the latest status in your account.'}</p><p className="mt-5 inline-flex max-w-full break-all rounded-full bg-[#F0EBE2] px-4 py-2 font-mono text-xs text-[#2E2D2B]">Order #{order._id}</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-5 sm:p-7"><h2 className="font-serif text-2xl text-[#2E2D2B]">Order details</h2><ul className="mt-5 divide-y divide-[#7E7C77]/15">{(order.items ?? []).map((item, index) => <li key={`${item.productName}-${index}`} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="font-semibold text-[#2E2D2B]">{item.productName}</p><p className="mt-1 text-xs text-[#7E7C77]">{item.color} · {item.size} · Qty {item.quantity}</p></div><p className="shrink-0 font-mono text-sm text-[#2E2D2B]">{formatPrice(item.unitPrice / 100 * item.quantity)}</p></li>)}</ul><div className="mt-5 border-t border-[#7E7C77]/15 pt-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6B7B6E]">Delivering to</p><p className="mt-2 text-sm font-bold text-[#2E2D2B]">{order.shippingAddress.fullName}</p><p className="mt-1 break-words text-xs leading-5 text-[#7E7C77]">{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br/>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br/>{order.shippingAddress.country}</p></div></section>
      <aside className="space-y-5 rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-5 sm:p-7"><h2 className="font-serif text-2xl text-[#2E2D2B]">Payment summary</h2><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#7E7C77]">Subtotal</dt><dd>{formatPrice(order.subtotal / 100)}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#7E7C77]">Discount</dt><dd>-{formatPrice(order.discount / 100)}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#7E7C77]">Delivery</dt><dd>{order.shippingFee ? formatPrice(order.shippingFee / 100) : 'Free'}</dd></div><div className="flex justify-between border-t border-[#7E7C77]/20 pt-4 text-base font-bold"><dt>Total</dt><dd>{formatPrice(order.total / 100)}</dd></div></dl><div className="rounded-xl bg-[#F0EBE2] p-4 text-xs leading-5 text-[#66645F]"><p><strong>Payment method:</strong> {isCod ? 'Cash on delivery' : 'Razorpay online payment'}</p><p className="mt-1"><strong>Payment status:</strong> {order.paymentStatus}</p><p className="mt-1"><strong>Order status:</strong> {order.orderStatus}</p></div><ButtonLink to={ROUTES.account} className="w-full">View my account</ButtonLink><ButtonLink to={ROUTES.newArrivals} variant="ghost" className="w-full"><ShoppingBag size={15}/> Continue shopping</ButtonLink><p className="text-center text-[10px] leading-5 text-[#7E7C77]">Need help? <Link to={ROUTES.support} className="font-semibold text-[#526457] underline underline-offset-4">Contact support</Link></p></aside>
    </div>
  </section>;
}
