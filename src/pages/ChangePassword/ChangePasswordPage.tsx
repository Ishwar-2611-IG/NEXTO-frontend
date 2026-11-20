import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api, setAccessToken, ApiError } from '../../services/api';

type ChangeResult = { accessToken: string; user: { id: string } };
export function ChangePasswordPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (isLoading) return <p className="p-12 text-center">Checking session…</p>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!user?.mustChangePassword) return <Navigate to={user?.role === 'customer' ? '/account' : '/admin'} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    setBusy(true);
    try { const result = await api.post<ChangeResult>('/auth/change-password', { currentPassword, newPassword }, { skipRefresh: true }); setAccessToken(result.accessToken); window.location.assign(user?.role === 'customer' ? '/account' : '/admin'); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Could not update password.'); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-[#F7F5F0] p-5"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border border-[#7E7C77]/15 bg-[#FFFCF7] p-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7B6E]">Account security</p><h1 className="font-serif text-3xl">Change your password</h1><p className="text-sm leading-6 text-[#7E7C77]">Your administrator account requires a new password before continuing.</p><label className="block text-xs font-semibold">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="block text-xs font-semibold">New password<input required minLength={12} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="block text-xs font-semibold">Confirm new password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<button disabled={busy} className="min-h-12 w-full rounded-full bg-[#526457] text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">{busy ? 'Updating…' : 'Update password'}</button></form></main>;
}
