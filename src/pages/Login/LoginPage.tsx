import { StoreImage } from '../../components/common/StoreImage';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, BadgeCheck, Box, Heart, Sparkles } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { IMG, unsplash } from '../../constants/images';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { LoginForm } from '../../features/auth/LoginForm';
import { getSafePostLoginRedirect } from '../../features/auth/safeRedirect';
import type { StoreUser } from '../../services/storeApi';

const PERKS = [
  { title: 'A smoother checkout', text: 'Your shopping, without the extra steps.', icon: Box },
  { title: 'Your saved edit', text: 'Keep the pieces you come back to.', icon: Heart },
  { title: 'Order updates', text: 'A clearer view of what is on its way.', icon: BadgeCheck },
  { title: 'First to the drop', text: 'Discover new pieces as they arrive.', icon: Sparkles },
];

function isStaffRole(role?: string): boolean {
  return role === 'admin' || role === 'support' || role === 'inventory_manager';
}

export function LoginPage() {
  usePageTitle('Sign In');
  const { isLoggedIn, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedRedirect = (location.state as { from?: unknown } | null)?.from;
  const redirectTo = requestedRedirect ? getSafePostLoginRedirect(requestedRedirect) : '/';

  if (isLoading) return <div className="px-4 py-20 text-center text-sm text-[#7E7C77]">Checking your session…</div>;
  const postLoginTarget = user?.mustChangePassword ? '/change-password' : isStaffRole(user?.role) ? '/admin' : redirectTo;
  if (isLoggedIn) return <Navigate to={postLoginTarget} replace />;

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <Container>
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] shadow-[0_24px_80px_-38px_rgba(46,45,43,0.24)] lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#2E2D2B] p-6 sm:min-h-[500px] sm:p-10 lg:min-h-[690px] lg:p-12">
            <StoreImage src={unsplash(IMG.streetwearModel, 1400)} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover object-center opacity-65" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1d1e1b]/95 via-[#1d1e1b]/45 to-[#1d1e1b]/30" />

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-extrabold tracking-[0.22em] text-white">NEXTO<span className="text-[#B5C1B3]">.</span></span>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">Member space</span>
            </div>

            <div className="relative mt-16 space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D0D9CD]">Wear what feels like you</p>
              <h1 className="max-w-lg font-serif text-5xl font-medium leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
                A more personal way to wear NEXTO<span className="text-[#B5C1B3]">.</span>
              </h1>
              <p className="max-w-md text-sm leading-7 text-white/80 sm:text-base">
                Your favourite pieces, saved for later. Your orders, all in one place. Your next look, just a little closer.
              </p>
              <div className="grid grid-cols-1 gap-3 border-t border-white/20 pt-5 sm:grid-cols-2 sm:gap-4">
                {PERKS.map(({ title, text, icon: Icon }) => (
                  <div key={title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#D0D9CD]"><Icon size={17} strokeWidth={1.7} aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/65">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-10 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/65"><ArrowDownRight size={14} aria-hidden="true" /> Thoughtful essentials. Everyday confidence.</p>
          </aside>

          <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-12 xl:p-16">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7B6E]">Welcome to your space</p>
                <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#2E2D2B] sm:text-5xl">Good to see you.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#7E7C77]">Sign in or create your account to keep your NEXTO edit close.</p>
              </div>
              <span className="hidden size-11 shrink-0 place-items-center rounded-full bg-[#F0EBE2] text-[#526457] sm:grid"><ArrowUpRight size={19} aria-hidden="true" /></span>
            </div>
            <LoginForm onAuthenticated={(authenticatedUser: StoreUser) => { navigate(authenticatedUser.mustChangePassword ? '/change-password' : isStaffRole(authenticatedUser.role) ? '/admin' : redirectTo, { replace: true }); }} />
            <p className="mt-8 text-center text-[10px] leading-5 text-[#7E7C77]">By continuing, you agree to our store terms and privacy practices. Your account is protected by NEXTO secure session authentication.</p>
          </div>
        </div>
      </Container>
    </div>
  );
}
