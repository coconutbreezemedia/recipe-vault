'use client';

import { useEffect, useState } from 'react';
import { isPinSet, verifyPin } from '@/lib/pin';

// Wraps the app in a local passcode lock IF the user has set one on this device.
export function PinGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLocked(isPinSet());
    setChecked(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyPin(pin)) {
      setLocked(false);
      setPin('');
      setError('');
    } else {
      setError('Incorrect passcode');
      setPin('');
    }
  };

  // Avoid a flash of the app before we know whether it's locked.
  if (!checked) return <div className="min-h-[100dvh] bg-bg" />;

  if (!locked) return <>{children}</>;

  return (
    <div className="app-shell flex min-h-[100dvh] flex-col items-center justify-center px-8">
      <div className="mb-10 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-green">Reba&rsquo;s Private Kitchen</div>
        <h1 className="mt-3 font-serif text-4xl text-ink">Recipe Vault</h1>
        <div className="mx-auto mt-3 h-px w-9 bg-gold/60" />
      </div>
      <form onSubmit={submit} className="w-full max-w-xs">
        <label className="mb-2 block text-sm font-medium text-muted">Enter your passcode</label>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-center text-lg tracking-[0.3em] text-ink outline-none focus:border-green"
          placeholder="••••••"
        />
        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={!pin} className="mt-5 w-full rounded-2xl bg-green py-4 text-base font-extrabold text-bg shadow-glow disabled:opacity-50">
          Unlock
        </button>
      </form>
    </div>
  );
}
