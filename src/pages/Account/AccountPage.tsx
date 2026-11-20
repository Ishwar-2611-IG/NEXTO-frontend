import { StoreImage } from '../../components/common/StoreImage';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Bell, Box, ChevronRight,
  CircleHelp, CreditCard, Heart, LayoutDashboard, LogOut, MapPin, Package,
  Settings, ShieldCheck, ShoppingBag, Sparkles, Truck, UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { IMG, unsplash } from '../../constants/images';
import { ROUTES } from '../../constants/routes';
import { ACCOUNT_MENU, ACCOUNT_STATS, DEMO_USER } from '../../data/account';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/format';
import type { OrderRecord } from '../../features/checkout/CheckoutDialog';
import { AddressBookDialog, type SavedAddress } from '../../features/account/AddressBookDialog';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { useWishlist } from '../../hooks/useWishlist';
import { StatCardsSkeleton, OrderRowsSkeleton } from '../../components/common/Skeleton';

const menuIcons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Orders: Package,
  Wishlist: Heart,
  Addresses: MapPin,
  'Profile Details': UserRound,
  'Payment Methods': CreditCard,
  Notifications: Bell,
  'NEXTO Rewards': Sparkles,
  Settings,
};

const panelClass = 'rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] shadow-[0_10px_30px_-18px_rgba(46,45,43,0.16)]';
const eyebrowClass = 'text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7B6E]';
const mutedTextClass = 'text-sm leading-6 text-[#7E7C77]';

export function AccountPage() {
  usePageTitle('My Account');
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const { items: wishlist } = useWishlist();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Array<{ id: string; date: string; items: string; price: string; status: string; img: string; raw: OrderRecord }>>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressBookOpen, setAddressBookOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void Promise.all([
      api.get<{ orders: OrderRecord[] }>('/orders/my-orders?page=1&limit=50'),
      api.get<{ addresses: unknown[] }>('/addresses'),
    ]).then(([orderResult, addressResult]) => {
      if (!active) return;
      setOrders((orderResult.orders ?? []).map((order) => ({
        id: order._id, date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable',
        items: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} item${order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}`,
        price: formatPrice(order.total / 100), status: order.orderStatus.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase()),
        img: order.items[0]?.imageUrl || unsplash(IMG.editorialStreetwear, 200), raw: order,
      })));
      setAddresses((addressResult.addresses ?? []) as SavedAddress[]);
    }).catch((error) => { if (active) showToast(error instanceof Error ? error.message : 'Could not load account activity.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);
  const accountStats = useMemo(() => ACCOUNT_STATS.map((stat, index) => ({ ...stat, count: index === 0 ? String(orders.length) : index === 1 ? String(wishlist.length) : index === 2 ? String(addresses.length) : stat.count })), [orders.length, wishlist.length, addresses.length]);

  const handleSignOut = async () => {
    try { await logout(); navigate(ROUTES.home); showToast('Signed out successfully'); }
    catch { navigate(ROUTES.home); showToast('Signed out on this device.'); }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] pb-16 text-[#2E2D2B] sm:pb-20">
      <Container className="py-7 sm:py-10 lg:py-12">
        <header className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`${eyebrowClass} mb-3`}>NEXTO / YOUR SPACE</p>
            <h1 className="font-serif text-4xl font-semibold leading-none tracking-tight sm:text-5xl lg:text-6xl">My account<span className="text-[#6B7B6E]">.</span></h1>
            <p className={`mt-3 max-w-xl ${mutedTextClass}`}>A considered home for your orders, saved pieces, and membership details.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#6B7B6E]/25 bg-[#FFFCF7] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#526457]">
            <BadgeCheck size={15} aria-hidden="true" /> NEXTO member space
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-7">
          <aside className={`${panelClass} overflow-hidden lg:sticky lg:top-24`} aria-label="Account profile and navigation">
            <div className="relative overflow-hidden bg-[#F0EBE2] p-5 sm:p-6">
              <div aria-hidden="true" className="absolute -right-12 -top-14 size-40 rounded-full border border-[#6B7B6E]/15" />
              <div aria-hidden="true" className="absolute -right-5 -top-7 size-24 rounded-full border border-[#6B7B6E]/15" />
              <div className="relative flex items-center gap-3.5">
                <div className="grid size-[60px] shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/80 bg-[#FFFCF7] shadow-sm">
                  <StoreImage src={DEMO_USER.avatar} alt={`${user?.name ?? DEMO_USER.name} profile`} sizes="60px" width={60} height={60} loading="lazy" decoding="async" className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[#2E2D2B]">{user?.name ?? DEMO_USER.name}</h2>
                  <p className="mt-1 break-all text-xs leading-5 text-[#66645F]">{user?.email ?? DEMO_USER.email}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#526457]"><span className="size-1.5 rounded-full bg-[#6B7B6E]" aria-hidden="true" /> Active member</span>
                </div>
              </div>
            </div>

            <nav aria-label="Account navigation" className="p-3">
              <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#7E7C77]">Your account</p>
              <div className="space-y-1">
                {ACCOUNT_MENU.map((item) => {
                  const Icon = menuIcons[item.label] ?? CircleHelp;
                  const isActive = item.label === activeSection;
                  const itemClass = `group flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E] ${isActive ? 'bg-[#E8EDE6] text-[#405345]' : 'text-[#66645F] hover:bg-[#F9F6F0] hover:text-[#2E2D2B]'}`;
                  const content = <><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${isActive ? 'bg-[#FFFCF7] text-[#526457]' : 'bg-transparent text-[#7E7C77] group-hover:text-[#526457]'}`}><Icon size={16} strokeWidth={1.7} aria-hidden="true" /></span><span className="min-w-0 flex-1">{item.label}</span>{isActive && <span className="size-1.5 rounded-full bg-[#6B7B6E]" aria-hidden="true" />}</>;
                  return 'to' in item ? <Link key={item.label} to={item.to} className={itemClass} aria-current={isActive ? 'page' : undefined}>{content}</Link> : <button key={item.label} type="button" onClick={() => { setActiveSection(item.label); if (item.label === 'Addresses') setAddressBookOpen(true); else if (item.label === 'Orders') { setShowAllOrders(true); document.getElementById('recent-orders-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else showToast(`${item.label} editing is not supported by the current API.`); }} className={itemClass}>{content}<ChevronRight size={14} className="text-[#A6A29B]" aria-hidden="true" /></button>;
                })}
              </div>
            </nav>

            <div className="border-t border-[#7E7C77]/15 p-3">
              <button type="button" onClick={handleSignOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-xs font-semibold text-[#8E5C54] transition-colors hover:bg-[#F7EDE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E5C54]">
                <span className="grid size-8 place-items-center rounded-lg bg-[#F7EDE9]"><LogOut size={16} aria-hidden="true" /></span> Sign out
              </button>
            </div>
          </aside>

          <div className="min-w-0 space-y-5 sm:space-y-6">
            <section aria-labelledby="account-welcome-heading" className="group relative isolate flex min-h-[300px] items-end overflow-hidden rounded-2xl bg-[#2E2D2B] sm:min-h-[330px]">
              <StoreImage src={unsplash(IMG.editorialStreetwear, 1400)} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="absolute inset-0 -z-20 size-full object-cover object-[center_35%] transition-transform duration-700 group-hover:scale-[1.025]" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1D1E1B]/95 via-[#1D1E1B]/65 to-[#1D1E1B]/15" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
              <div className="max-w-2xl p-6 sm:p-9 lg:p-10">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D0D9CD]">Good to have you back</p>
                <h2 id="account-welcome-heading" className="font-serif text-5xl font-medium leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">Hello, {(user?.name ?? DEMO_USER.firstName).split(' ')[0]}<span className="text-[#B5C1B3]">.</span></h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/80">Your next favourite look starts here. Pick up where you left off and keep the pieces you love close.</p>
                <Link to={ROUTES.home} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E8EDE6] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#344538] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E2D2B]">Explore NEXTO <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
              <span className="absolute right-5 top-5 hidden items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/85 backdrop-blur-sm sm:inline-flex"><Sparkles size={12} aria-hidden="true" /> Your next move</span>
            </section>

            <section aria-labelledby="account-overview-heading">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className={eyebrowClass}>At a glance</p><h2 id="account-overview-heading" className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Your overview</h2></div>
                <p className="text-xs text-[#7E7C77]">A quick look at your NEXTO activity.</p>
              </div>
              {loading ? (
                <StatCardsSkeleton count={4} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {accountStats.map((stat, index) => {
                    const count = stat.count ?? wishlist.length;
                    const Icon = [ShoppingBag, Heart, MapPin, Sparkles][index] ?? Box;
                    const content = <div className="flex min-h-[154px] flex-col justify-between gap-5 p-5"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#F0EBE2] text-[#526457]"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span><span className="rounded-full bg-[#F9F6F0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#7E7C77]">0{index + 1}</span></div><div><p className="text-xs font-semibold text-[#66645F]">{stat.title}</p><p className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[#2E2D2B] sm:text-4xl">{count}</p><p className="mt-3 flex items-center justify-between gap-2 border-t border-[#7E7C77]/15 pt-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7E7C77]"><span>{stat.action.replace(' →', '')}</span><ArrowRight size={13} className="text-[#526457]" aria-hidden="true" /></p></div></div>;
                    const cardClass = `${panelClass} group block text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#6B7B6E]/40 hover:shadow-[0_16px_36px_-20px_rgba(46,45,43,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]`;
                    return 'to' in stat ? <Link key={stat.title} to={stat.to} className={cardClass}>{content}</Link> : <button key={stat.title} type="button" onClick={() => { if (index === 0) { setActiveSection('Orders'); document.getElementById('recent-orders-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else if (index === 2) { setActiveSection('Addresses'); setAddressBookOpen(true); } else showToast(`${stat.title} details are shown in your account sections.`); }} className={cardClass}>{content}</button>;
                  })}
                </div>
              )}
            </section>

            <section aria-labelledby="recent-orders-heading" className={`${panelClass} overflow-hidden`}>
              <div className="flex flex-col gap-3 border-b border-[#7E7C77]/15 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <div><p className={eyebrowClass}>Your purchases</p><h2 id="recent-orders-heading" className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Recent orders</h2><p className="mt-1.5 text-xs leading-5 text-[#7E7C77]">Keep an eye on the pieces making their way to you.</p></div>
                <button type="button" onClick={() => setShowAllOrders((current) => !current)} className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-[#7E7C77]/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#526457] transition-colors hover:border-[#6B7B6E]/50 hover:bg-[#F9F6F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E] sm:self-auto">{showAllOrders ? 'Show recent' : 'View all orders'} <ArrowUpRight size={13} aria-hidden="true" /></button>
              </div>
              {loading ? (
                <OrderRowsSkeleton count={3} />
              ) : orders.length > 0 ? (
                <ul className="divide-y divide-[#7E7C77]/15">
                  {orders.slice(0, showAllOrders ? orders.length : 5).map((order) => (
                    <li key={order.id} className="p-4 transition-colors hover:bg-[#F9F6F0]/60 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4 sm:items-center"><div className="size-[84px] shrink-0 overflow-hidden rounded-xl border border-[#7E7C77]/15 bg-[#F0EBE2] sm:size-[100px]"><StoreImage src={order.img} alt="" sizes="100px" width={100} height={100} loading="lazy" decoding="async" className="size-full object-cover" /></div><div className="min-w-0 py-1"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7E7C77]">Order reference</p><h3 className="mt-1 break-words text-sm font-bold text-[#2E2D2B]">#{order.id.slice(-8).toUpperCase()}</h3><p className="mt-1.5 text-xs leading-5 text-[#7E7C77]">{order.date}<span aria-hidden="true"> · </span>{order.items}</p><p className="mt-2 text-sm font-bold tabular-nums text-[#2E2D2B]">{order.price}</p></div></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#7E7C77]/15 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0"><span className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${order.status === 'Delivered' ? 'bg-[#E8EDE6] text-[#405345]' : order.status === 'Shipped' || order.status === 'Processing' ? 'bg-[#F4EBDD] text-[#80683D]' : order.status === 'Cancelled' ? 'bg-[#F7EDE9] text-[#8E5C54]' : 'bg-[#F0EBE2] text-[#66645F]'}`}><span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />{order.status}</span><Link to={`${ROUTES.orderConfirmation}?orderId=${encodeURIComponent(order.id)}`} state={{ order: order.raw }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#7E7C77]/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#526457] transition-colors hover:border-[#6B7B6E]/45 hover:bg-[#F9F6F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]">View details <ChevronRight size={13} aria-hidden="true" /></Link></div></div></li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-14 text-center sm:px-10"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F0EBE2] text-[#526457]"><Package size={21} aria-hidden="true" /></span><p className="mt-4 font-serif text-2xl font-semibold">No orders yet</p><p className="mt-2 text-sm text-[#7E7C77]">Your next favourite piece could be waiting for you.</p><Link to={ROUTES.collections} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#526457] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#445549]">Explore the collection <ArrowRight size={14} aria-hidden="true" /></Link></div>
              )}
            </section>

            <section className={`${panelClass} flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7`}>
              <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#E8EDE6] text-[#526457]"><Heart size={20} strokeWidth={1.7} aria-hidden="true" /></span><div><p className={eyebrowClass}>Keep the pieces you love</p><h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Your wishlist</h2><p className="mt-1.5 text-sm leading-6 text-[#7E7C77]">{wishlist.length === 0 ? "Save your favourite styles and find them here when you're ready." : `${wishlist.length} saved ${wishlist.length === 1 ? 'piece' : 'pieces'} waiting for you.`}</p></div></div>
              <Link to={ROUTES.wishlist} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#6B7B6E]/35 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#405345] transition-colors hover:bg-[#E8EDE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]">Explore wishlist <ArrowRight size={14} aria-hidden="true" /></Link>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`${panelClass} flex items-start gap-3 p-4`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F0EBE2] text-[#526457]"><Truck size={17} aria-hidden="true" /></span><div><p className="text-xs font-bold">Delivery information</p><p className="mt-1 text-xs leading-5 text-[#7E7C77]">Complimentary delivery over ₹999.</p></div></div>
              <div className={`${panelClass} flex items-start gap-3 p-4`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F0EBE2] text-[#526457]"><ShieldCheck size={17} aria-hidden="true" /></span><div><p className="text-xs font-bold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-[#7E7C77]">Our support page has the answers to common questions.</p><Link to={ROUTES.support} className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#526457] underline underline-offset-4">Visit support <ArrowRight size={12} aria-hidden="true" /></Link></div></div>
            </div>
          </div>
        </div>
      </Container>
      {addressBookOpen && <AddressBookDialog addresses={addresses} onClose={() => setAddressBookOpen(false)} onChange={setAddresses} />}
    </div>
  );
}
