'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { isPinSet, setPin, clearPin } from '@/lib/pin';
import { BackIcon, DownloadIcon, UploadIcon, LockIcon } from '@/components/icons';
import { CloudSyncCard } from '@/components/cloud-sync-card';

export function Settings() {
  const { back, exportBackup, importBackup, recipes } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [pinExists, setPinExists] = useState(isPinSet());

  // inline PIN editor
  const [editingPin, setEditingPin] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinErr, setPinErr] = useState('');

  const onRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Restoring will replace everything currently in the app with the backup. Continue?')) {
      e.target.value = '';
      return;
    }
    try {
      await importBackup(file);
      setMsg('Backup restored.');
    } catch {
      setMsg('That file was not a valid Recipe Vault backup.');
    } finally {
      e.target.value = '';
    }
  };

  const savePin = async () => {
    setPinErr('');
    if (pin1.length < 4) {
      setPinErr('Use at least 4 digits.');
      return;
    }
    if (pin1 !== pin2) {
      setPinErr('The two entries do not match.');
      return;
    }
    await setPin(pin1);
    setPinExists(true);
    setEditingPin(false);
    setPin1('');
    setPin2('');
    setMsg('Passcode saved.');
  };

  const removePin = () => {
    if (window.confirm('Remove the passcode lock?')) {
      clearPin();
      setPinExists(false);
      setMsg('Passcode removed.');
    }
  };

  const card = 'rounded-2xl border border-line bg-surface p-4';
  const btn = 'flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-3 font-semibold text-bg';
  const ghost = 'flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-3 font-medium text-ink';

  return (
    <div className="min-h-screen pb-16">
      <div className="flex items-center gap-3 p-4 pt-[calc(env(safe-area-inset-top,0px)+24px)]">
        <button type="button" onClick={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-ink">
          <BackIcon size={20} />
        </button>
        <h1 className="text-xl font-bold text-ink">Settings</h1>
      </div>

      <div className="space-y-6 px-4">
        {msg && <div className="rounded-xl border border-green/40 bg-green/10 px-4 py-3 text-sm text-green">{msg}</div>}

        {/* Backup */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gold">Backup &amp; restore</h2>
          <div className={card}>
            <p className="text-sm text-muted">
              Your recipes live on this device only. Save a backup file now and then so nothing is lost if you change phones or clear your browser.
            </p>
            <p className="mt-2 text-xs text-muted">{recipes.length} recipe{recipes.length === 1 ? '' : 's'} on this device.</p>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={exportBackup} className={btn}>
                <DownloadIcon size={18} /> Save a backup
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className={ghost}>
                <UploadIcon size={18} /> Restore from a backup
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onRestore} />
            </div>
          </div>
        </section>

        <CloudSyncCard />

        {/* Passcode */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gold">Passcode lock</h2>
          <div className={card}>
            <div className="flex items-center gap-2 text-sm text-ink">
              <LockIcon size={16} />
              {pinExists ? 'A passcode is set on this device.' : 'No passcode — the app opens straight away.'}
            </div>

            {editingPin ? (
              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin1}
                  onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
                  placeholder="New passcode"
                  className="w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-center tracking-[0.3em] text-ink focus:border-green focus:outline-none"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin2}
                  onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm passcode"
                  className="w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-center tracking-[0.3em] text-ink focus:border-green focus:outline-none"
                />
                {pinErr && <p className="text-sm text-red-400">{pinErr}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={savePin} className={btn}>Save passcode</button>
                  <button type="button" onClick={() => { setEditingPin(false); setPin1(''); setPin2(''); setPinErr(''); }} className={ghost}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <button type="button" onClick={() => setEditingPin(true)} className={ghost}>
                  {pinExists ? 'Change passcode' : 'Set a passcode'}
                </button>
                {pinExists && (
                  <button type="button" onClick={removePin} className="w-full rounded-xl px-4 py-3 text-sm text-red-400">
                    Remove passcode
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-muted/70">
          Recipe Vault · works offline · Platform developed by Coconut Breeze Media
        </p>
      </div>
    </div>
  );
}
