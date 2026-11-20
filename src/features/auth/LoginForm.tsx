import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Apple, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound, LoaderCircle } from 'lucide-react';
import { TextField } from '../../components/common/FormField';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { validateLogin, type LoginErrors } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';
import type { StoreUser } from '../../services/storeApi';


declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: { clientId: string; scope: string; redirectURI: string; state: string; usePopup: boolean }) => void;
        signIn: () => Promise<{ authorization: { id_token: string; code?: string }; user?: { name?: { firstName?: string; lastName?: string } } }>;
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const APPLE_AUTH_ENABLED = import.meta.env.VITE_APPLE_AUTH_ENABLED === 'true';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;

function loadProviderScript(id: string, src: string): Promise<void> {
  if (document.getElementById(id)) {
    if (id === 'nexto-google-identity' && window.google) return Promise.resolve();
    if (id === 'nexto-apple-auth' && window.AppleID) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id) as HTMLScriptElement;
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Could not load identity provider')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load identity provider'));
    document.head.appendChild(script);
  });
}

export type AuthMode = 'signin' | 'signup';

interface LoginFormProps {
  onAuthenticated: (user: StoreUser) => void;
}

/** Sign-in and registration use the NEXTO backend session API. */
export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const { showToast } = useToast();
  const { socialLogin, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [socialSubmitting, setSocialSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    let cancelled = false;
    void loadProviderScript('nexto-google-identity', 'https://accounts.google.com/gsi/client')
      .then(() => {
        if (cancelled || !window.google || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (!response.credential) return;
            setSocialSubmitting(true);
            void socialLogin('google', response.credential)
              .then((user) => {
                showToast('Signed in with Google successfully.');
                onAuthenticated(user);
              })
              .catch((error: unknown) => {
                showToast(error instanceof ApiError ? error.message : 'Google sign-in failed. Please try again.');
              })
              .finally(() => setSocialSubmitting(false));
          },
        });
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 240,
          logo_alignment: 'left',
        });
      })
      .catch(() => showToast('Google sign-in could not be loaded. Check your internet connection.'));
    return () => { cancelled = true; };
  }, [socialLogin, onAuthenticated, showToast]);

  const handleAppleSignIn = async () => {
    if (!APPLE_AUTH_ENABLED || !APPLE_CLIENT_ID || !APPLE_REDIRECT_URI) {
      showToast('Apple sign-in is not configured yet.');
      return;
    }
    setSocialSubmitting(true);
    try {
      await loadProviderScript('nexto-apple-auth', 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
      if (!window.AppleID) throw new Error('Apple sign-in SDK is unavailable.');
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: APPLE_REDIRECT_URI,
        state: window.crypto.randomUUID(),
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const identityToken = response.authorization?.id_token;
      if (!identityToken) throw new Error('Apple did not return an identity token.');
      const authenticatedUser = await socialLogin('apple', identityToken, {
        firstName: response.user?.name?.firstName,
        lastName: response.user?.name?.lastName,
      });
      showToast('Signed in with Apple successfully.');
      onAuthenticated(authenticatedUser);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Apple sign-in failed. Please try again.');
    } finally {
      setSocialSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateLogin(identifier, password, mode);
    if (mode === 'signup' && name.trim().length < 2) found.name = 'Please enter your full name.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      const authenticatedUser = mode === 'signin'
        ? await login(identifier.trim(), password)
        : await register(name.trim(), identifier.trim(), password);
      setPassword('');
      showToast(mode === 'signin' ? 'Signed in successfully.' : 'Your NEXTO account has been created.');
      onAuthenticated(authenticatedUser);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not connect to NEXTO. Check that the backend is running.';
      showToast(message);
    } finally { setSubmitting(false); }
  };

  const isSignIn = mode === 'signin';
  const tabClass = (tab: AuthMode) => `relative min-h-11 flex-1 rounded-full px-4 text-center text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E] ${mode === tab ? 'bg-[#FFFCF7] text-[#2E2D2B] shadow-sm' : 'text-[#7E7C77] hover:text-[#2E2D2B]'}`;

  return (
    <div className="w-full">
      <div role="tablist" aria-label="Account access" className="mb-7 flex rounded-full border border-[#7E7C77]/15 bg-[#F0EBE2]/70 p-1">
        <button type="button" role="tab" aria-selected={isSignIn} onClick={() => switchMode('signin')} className={tabClass('signin')}>Sign In</button>
        <button type="button" role="tab" aria-selected={!isSignIn} onClick={() => switchMode('signup')} className={tabClass('signup')}>Create account</button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-[#2E2D2B]">{isSignIn ? 'Welcome back' : 'Make it yours'}</h3>
          <p className="mt-1.5 text-xs leading-5 text-[#7E7C77]">{isSignIn ? 'Enter your details to continue.' : 'A few details to create your NEXTO profile.'}</p>
        </div>

        <div className="space-y-4">
          {!isSignIn && <div className="relative"><UserRound size={16} strokeWidth={1.7} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-[43px] z-10 text-[#7E7C77]" /><TextField label="Full name" type="text" autoComplete="name" placeholder="Your full name" value={name} error={errors.name} inputClassName="min-h-12 rounded-xl py-3 pl-10 pr-4 text-sm" onChange={(e) => setName(e.target.value)} /></div>}
          <div className="relative">
            <Mail size={16} strokeWidth={1.7} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-[43px] z-10 text-[#7E7C77]" />
            <TextField label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={identifier} error={errors.identifier} inputClassName="min-h-12 rounded-xl py-3 pl-10 pr-4 text-sm" onChange={(e) => setIdentifier(e.target.value)} />
          </div>

          <div className="relative">
            <KeyRound size={16} strokeWidth={1.7} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-[43px] z-10 text-[#7E7C77]" />
            <TextField label="Password" type={showPassword ? 'text' : 'password'} autoComplete={isSignIn ? 'current-password' : 'new-password'} placeholder="Enter your password" value={password} error={errors.password} inputClassName="min-h-12 rounded-xl py-3 pl-10 pr-12 text-sm" onChange={(e) => setPassword(e.target.value)} labelAside={isSignIn ? <Link to="/forgot-password" className="text-[11px] font-semibold text-[#526457] underline underline-offset-4 hover:text-[#2E2D2B]">Forgot password?</Link> : undefined} />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2.5 top-[34px] grid size-9 place-items-center rounded-lg text-[#7E7C77] transition-colors hover:bg-[#F0EBE2] hover:text-[#2E2D2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]">
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>

          {isSignIn && <p className="flex min-h-9 items-center gap-2.5 text-xs text-[#66645F]"><ShieldCheck size={15} className="text-[#526457]" aria-hidden="true"/><span>Your secure session is restored automatically on this browser.</span></p>}

          <Button type="submit" size="lg" arrow className="w-full rounded-full !py-4" disabled={submitting}>{submitting ? <><LoaderCircle size={16} className="animate-spin" /> Please wait…</> : isSignIn ? 'Sign In to NEXTO' : 'Create my account'}</Button>
        </div>

        <div className="flex items-center gap-3 py-1" aria-hidden="true"><span className="h-px flex-1 bg-[#7E7C77]/20" /><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7E7C77]">Or continue with</span><span className="h-px flex-1 bg-[#7E7C77]/20" /></div>

        <div className="grid grid-cols-2 items-center gap-3">
          <div className="flex min-h-12 items-center justify-center" aria-label="Continue with Google">
            {GOOGLE_CLIENT_ID
              ? <div ref={googleButtonRef} className={socialSubmitting ? 'pointer-events-none opacity-60' : ''} />
              : <button type="button" disabled className="min-h-12 w-full rounded-xl border border-[#7E7C77]/20 bg-[#F0EBE2] px-3 text-xs font-semibold text-[#7E7C77]">Google setup required</button>}
          </div>
          <button type="button" onClick={handleAppleSignIn} disabled={socialSubmitting || !APPLE_AUTH_ENABLED || !APPLE_CLIENT_ID || !APPLE_REDIRECT_URI} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#7E7C77]/20 bg-[#FFFCF7] px-3 text-xs font-semibold text-[#2E2D2B] transition-colors hover:border-[#6B7B6E]/50 hover:bg-[#F9F6F0] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]"><Apple size={17} strokeWidth={1.8} aria-hidden="true" /> {APPLE_AUTH_ENABLED ? 'Apple' : 'Apple coming soon'}</button>
        </div>
        {socialSubmitting && <p role="status" className="text-center text-xs text-[#6B7B6E]">Verifying your account…</p>}
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#7E7C77]"><ShieldCheck size={13} aria-hidden="true" /> Your password is sent securely to the NEXTO API and is never stored by this page.</p>
      </form>

      <div className="mt-7 border-t border-[#7E7C77]/15 pt-5 text-center text-xs text-[#7E7C77]">
        {isSignIn ? <>New to NEXTO? <button type="button" onClick={() => switchMode('signup')} className="ml-1 font-bold text-[#526457] underline underline-offset-4 hover:text-[#2E2D2B]">Create an account</button></> : <>Already a member? <button type="button" onClick={() => switchMode('signin')} className="ml-1 font-bold text-[#526457] underline underline-offset-4 hover:text-[#2E2D2B]">Sign In</button></>}
      </div>
    </div>
  );
}
