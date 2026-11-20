import { useState, type FormEvent } from 'react';
import { MapPin, Plus, Trash2, X, Star, LoaderCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export interface SavedAddress {
  _id: string; label: string; fullName: string; phone: string; addressLine1: string; addressLine2?: string;
  city: string; state: string; postalCode: string; country: string; isDefault: boolean;
}
const blank = { label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false };
const inputClass = 'w-full rounded-xl border border-[#7E7C77]/25 bg-[#FFFCF7] px-3.5 py-3 text-sm outline-none focus:border-[#6B7B6E] focus:ring-2 focus:ring-[#6B7B6E]/15 disabled:opacity-60';
export function AddressBookDialog({ addresses, onClose, onChange }: { addresses: SavedAddress[]; onClose: () => void; onChange: (addresses: SavedAddress[]) => void }) {
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  function patch<K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  const refresh = async () => { const result = await api.get<{ addresses: SavedAddress[] }>('/addresses'); onChange(result.addresses ?? []); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post('/addresses', form);
      await refresh(); setForm(blank); setFormOpen(false); showToast('Delivery address saved.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not save the address.'); }
    finally { setSaving(false); }
  };
  const setDefault = async (id: string) => {
    setBusyId(id);
    try { await api.patch(`/addresses/${id}/default`, {}); await refresh(); showToast('Default address updated.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not update the default address.'); }
    finally { setBusyId(null); }
  };
  const remove = async (id: string) => {
    setBusyId(id);
    try { await api.delete(`/addresses/${id}`); await refresh(); showToast('Address removed.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove the address.'); }
    finally { setBusyId(null); }
  };
  return <div className="fixed inset-0 z-[110] flex items-end justify-center bg-[#211f1b]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="address-book-title" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-[#F9F6F0] p-5 shadow-2xl sm:rounded-3xl sm:p-8">
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-[#7E7C77]/20 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6B7B6E]">Your account</p><h2 id="address-book-title" className="mt-1 font-serif text-3xl text-[#2E2D2B]">Saved addresses</h2><p className="mt-1 text-xs text-[#7E7C77]">Manage delivery addresses for future orders.</p></div><button type="button" onClick={onClose} aria-label="Close address book" className="grid size-10 place-items-center rounded-full border border-[#7E7C77]/20 bg-[#FFFCF7]"><X size={18}/></button></header>
      {!formOpen && <div className="mb-5 flex justify-end"><Button onClick={() => setFormOpen(true)}><Plus size={15}/> Add address</Button></div>}
      {formOpen && <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-4 sm:grid-cols-2 sm:p-5">
        <label className="space-y-1 text-xs font-semibold">Label<input required minLength={2} maxLength={40} value={form.label} onChange={(e) => patch('label', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold">Full name<input required minLength={2} autoComplete="name" value={form.fullName} onChange={(e) => patch('fullName', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold">Phone<input required pattern="\+?[0-9]{10,15}" value={form.phone} onChange={(e) => patch('phone', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold sm:col-span-2">Address line 1<input required minLength={5} value={form.addressLine1} maxLength={200} onChange={(e) => patch('addressLine1', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold sm:col-span-2">Address line 2<input value={form.addressLine2} maxLength={200} onChange={(e) => patch('addressLine2', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold">City<input required minLength={2} value={form.city} maxLength={100} onChange={(e) => patch('city', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold">State<input required minLength={2} value={form.state} maxLength={100} onChange={(e) => patch('state', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold">PIN code<input required minLength={4} maxLength={12} value={form.postalCode} onChange={(e) => patch('postalCode', e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-xs font-semibold">Country<input required minLength={2} value={form.country} maxLength={100} onChange={(e) => patch('country', e.target.value)} className={inputClass}/></label>
        <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={form.isDefault} onChange={(e) => patch('isDefault', e.target.checked)} className="accent-[#526457]"/> Make this my default address</label>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle size={15} className="animate-spin"/> Saving…</> : 'Save address'}</Button><Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setForm(blank); }}>Cancel</Button></div>
      </form>}
      {addresses.length ? <div className="grid gap-3 sm:grid-cols-2">{addresses.map((address) => <article key={address._id} className="rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-4"><div className="flex items-start justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-[#F0EBE2] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#526457]"><MapPin size={12}/>{address.label}</span>{address.isDefault && <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#526457]"><Star size={11} fill="currentColor"/> Default</span>}</div><p className="mt-4 text-sm font-bold text-[#2E2D2B]">{address.fullName}</p><p className="mt-1 break-words text-xs leading-5 text-[#66645F]">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br/>{address.city}, {address.state} {address.postalCode}<br/>{address.country}</p><p className="mt-2 text-xs text-[#7E7C77]">{address.phone}</p><div className="mt-4 flex flex-wrap gap-2 border-t border-[#7E7C77]/15 pt-3">{!address.isDefault && <button type="button" disabled={busyId === address._id} onClick={() => void setDefault(address._id)} className="rounded-full border border-[#7E7C77]/20 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-[#526457] disabled:opacity-50">Set default</button>}<button type="button" disabled={busyId === address._id} onClick={() => void remove(address._id)} className="inline-flex items-center gap-1 rounded-full border border-[#8E5C54]/20 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-[#8E5C54] disabled:opacity-50"><Trash2 size={12}/> Remove</button></div></article>)}</div> : !formOpen && <div className="rounded-2xl border border-dashed border-[#7E7C77]/30 p-10 text-center"><MapPin size={24} className="mx-auto text-[#6B7B6E]"/><p className="mt-3 font-serif text-2xl text-[#2E2D2B]">No saved addresses yet</p><p className="mt-1 text-sm text-[#7E7C77]">Add a delivery address to make checkout easier.</p></div>}
    </section>
  </div>;
}
