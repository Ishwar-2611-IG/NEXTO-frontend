import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MAIN_NAV, ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, UserIcon } from '../common/icons';
import { SearchForm } from './SearchForm';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6B7B6E]';
const iconClass = 'w-5 h-5 stroke-[1.7]';
const maxBadge = 99;

const withCount = (label: string, count: number) =>
  count > 0 ? `${label}, ${count} ${count === 1 ? 'item' : 'items'}` : label;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative block whitespace-nowrap text-xs font-semibold uppercase text-[#2E2D2B]/90',
    'hover:text-[#6B7B6E] transition-colors',
    focusRing,
    'border-b border-[#7E7C77]/20 py-4 tracking-[0.08em] hover:bg-[#F0EBE2]',
    'md:border-0 md:py-2.5 md:text-[10px] md:tracking-[0.04em] md:hover:bg-transparent',
    'lg:text-xs lg:tracking-[0.07em]',
    'md:after:absolute md:after:inset-x-0 md:after:bottom-0.5 md:after:h-px md:after:origin-right md:after:scale-x-0 md:after:bg-[#6B7B6E]',
    'md:hover:after:origin-left md:hover:after:scale-x-100 md:focus-visible:after:origin-left md:focus-visible:after:scale-x-100',
    'motion-safe:md:after:transition-transform motion-safe:md:after:duration-200',
    isActive ? 'text-[#6B7B6E] md:after:origin-left md:after:scale-x-100' : '',
  ].join(' ');

export function Header() {
  const { isLoggedIn, user } = useAuth();
  const { count: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navId = useId();
  const containerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeMenu();
      toggleRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        closeMenu();
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) closeMenu();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMenu]);

  const HeaderMenuIcon = menuOpen ? CloseIcon : MenuIcon;
  const headerClass =
    'sticky top-0 z-[100] border-b border-[#7E7C77]/20 bg-[#F9F6F0]/92 text-[#2E2D2B] backdrop-blur-xl';

  return (
    <header
      ref={containerRef}
      className={`${headerClass} grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 md:min-h-[86px] md:grid-cols-[auto_minmax(0,1fr)_minmax(10.5rem,13rem)_auto] md:gap-x-4 md:px-[3vw] md:py-0 lg:grid-cols-[auto_minmax(0,1fr)_minmax(12rem,15.5rem)_auto] lg:gap-x-6 lg:px-[clamp(1.5rem,4.7vw,5rem)] xl:gap-x-8`}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls={navId}
        onClick={toggleMenu}
        className={`col-start-1 row-start-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#2E2D2B] transition hover:bg-[#6B7B6E]/10 active:scale-95 motion-safe:duration-200 md:hidden ${focusRing}`}
      >
        <HeaderMenuIcon aria-hidden="true" className={iconClass} />
      </button>

      <Link
        to={ROUTES.home}
        onClick={closeMenu}
        aria-label="NEXTO home"
        className={`col-start-2 row-start-1 w-max justify-self-center py-1.5 text-2xl font-extrabold leading-none tracking-[-0.07em] text-[#2E2D2B] transition-opacity hover:opacity-80 motion-safe:duration-200 md:col-start-1 md:justify-self-start md:text-[28px] xl:text-[32px] ${focusRing}`}
      >
        NEXTO
      </Link>

      <nav
        id={navId}
        aria-label="Main navigation"
        data-open={menuOpen}
        className={[
          'absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-4.5rem)] overflow-y-auto',
          'border-t border-[#7E7C77]/20 bg-[#F9F6F0]/[0.98] px-5 pb-5 pt-2 shadow-[0_18px_35px_rgba(46,45,43,0.08)]',
          'invisible -translate-y-2 opacity-0 pointer-events-none motion-safe:transition-[opacity,transform,visibility] motion-safe:duration-200',
          'data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100 data-[open=true]:pointer-events-auto',
          'md:visible md:static md:col-start-2 md:row-start-1 md:max-h-none md:translate-y-0 md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:opacity-100 md:shadow-none md:pointer-events-auto',
        ].join(' ')}
      >
        <ul className="flex flex-col md:flex-row md:items-center md:justify-center md:gap-4 lg:gap-8">
          {MAIN_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={closeMenu}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <SearchForm
        className="col-span-3 row-start-2 md:col-span-1 md:col-start-3 md:row-start-1"
        onSearch={closeMenu}
      />

      <div className="col-start-3 row-start-1 flex items-center justify-end gap-0.5 sm:gap-2 md:col-start-4">
        {isLoggedIn ? (
          <details className="relative">
            <summary aria-label="Open account menu" title="Account" className={`relative grid size-10 cursor-pointer list-none place-items-center rounded-full text-[#2E2D2B] transition hover:bg-[#6B7B6E]/10 ${focusRing}`}>
              <UserIcon aria-hidden="true" className={iconClass} />
            </summary>
            <div className="absolute right-0 top-12 z-50 min-w-48 rounded-xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-2 shadow-xl">
              <Link to={ROUTES.account} className="block rounded-lg px-3 py-2.5 text-xs font-semibold text-[#2E2D2B] hover:bg-[#F0EBE2]">My account</Link>
              {['admin', 'support', 'inventory_manager'].includes(user?.role ?? '') && <Link to="/admin" className="block rounded-lg px-3 py-2.5 text-xs font-semibold text-[#405345] hover:bg-[#E8EDE6]">Admin Panel</Link>}
            </div>
          </details>
        ) : (
          <Link to={ROUTES.login} aria-label="Sign in" title="Sign in" className={`relative hidden size-10 shrink-0 items-center justify-center rounded-full text-[#2E2D2B] transition hover:bg-[#6B7B6E]/10 active:scale-95 motion-safe:duration-200 md:inline-flex ${focusRing}`}>
            <UserIcon aria-hidden="true" className={iconClass} />
          </Link>
        )}

        <Link
          to={ROUTES.wishlist}
          aria-label={withCount('Open wishlist', wishlistItems.length)}
          title="Wishlist"
          className={`relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#2E2D2B] transition hover:bg-[#6B7B6E]/10 active:scale-95 motion-safe:duration-200 ${focusRing}`}
        >
          <HeartIcon aria-hidden="true" className={iconClass} />
          {wishlistItems.length > 0 && (
            <span aria-hidden="true" className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#526457] px-1 text-[10px] font-extrabold leading-none text-white">
              {wishlistItems.length > maxBadge ? `${maxBadge}+` : wishlistItems.length}
            </span>
          )}
        </Link>

        <Link
          to={ROUTES.cart}
          aria-label={withCount('Open shopping bag', cartCount)}
          title="Shopping bag"
          className={`relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#2E2D2B] transition hover:bg-[#6B7B6E]/10 active:scale-95 motion-safe:duration-200 ${focusRing}`}
        >
          <BagIcon aria-hidden="true" className={iconClass} />
          {cartCount > 0 && (
            <span aria-hidden="true" className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#526457] px-1 text-[10px] font-extrabold leading-none text-white">
              {cartCount > maxBadge ? `${maxBadge}+` : cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
