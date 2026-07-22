'use client';

import { useEffect, useState } from 'react';
import { isSyncConfigured } from '@/lib/supa-config';
import { disableSync, enableSync, getSyncStatus, linkDevice, syncNow } from '@/lib/sync';

const card = 'rounded-2xl border border-line bg-surface p-4';
const btn = 'flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-3 font-semibold text-bg';
const ghost = 'flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-3 font-medium text-ink';

export function CloudSyncCard() {
  const [enabled, setEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [newKey, setNewKey] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkKey, setLinkKey] = useState('');

  useEffect(() => getSyncStatus().subscribe((s) => {
    setEnabled(s.enabled);
    setLastSync(s.lastSync);
    setPending(s.pending);
  }), []);

  if (!isSyncConfigured()) return null;

  const onEnable = async () => {
    setErr('');
    setBusy(true);
    try {
      setNewKey(await enableSync());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onLink = async () => {
    setErr('');
    const key = linkKey.trim();
    if (!key) return;
    setBusy(true);
    try {
      await linkDevice(key);
      setLinking(false);
      setLinkKey('');
    } catch {
      setErr('That vault key was not recognized. Check it and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onDisable = async () => {
    if (!window.confirm('Turn off sync on this device? Your recipes stay here and in the cloud — this device just stops syncing until you enter the vault key again.')) return;
    await disableSync();
    setNewKey('');
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-gold">Cloud sync</h2>
      <div className={card}>
        {err && <p className="mb-3 text-sm text-red-400">{err}</p>}

        {newKey ? (
          <div className="space-y-3">
            <p className="text-sm text-ink">Sync is on. This is your vault key — it is the only way to open your vault on another device, and it is shown only once:</p>
            <p className="select-all break-all rounded-xl border border-green/40 bg-green/10 px-4 py-3 text-center font-mono text-sm text-green">{newKey}</p>
            <p className="text-xs text-muted">Screenshot it or save it somewhere safe (Notes, password manager). Anyone with this key can see and edit your vault.</p>
            <button
              type="button"
              className={ghost}
              onClick={() => { void navigator.clipboard?.writeText(newKey); }}
            >
              Copy key
            </button>
            <button type="button" className={btn} onClick={() => setNewKey('')}>I saved it</button>
          </div>
        ) : enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-ink">Sync is on for this device.</p>
            <p className="text-xs text-muted">
              {pending > 0
                ? `${pending} change${pending === 1 ? '' : 's'} waiting to upload.`
                : lastSync
                  ? `Last synced ${new Date(lastSync).toLocaleString()}.`
                  : 'Not synced yet.'}
            </p>
            <button type="button" disabled={busy} className={ghost} onClick={() => { setBusy(true); void syncNow().finally(() => setBusy(false)); }}>
              {busy ? 'Syncing…' : 'Sync now'}
            </button>
            <button type="button" onClick={onDisable} className="w-full rounded-xl px-4 py-3 text-sm text-red-400">
              Turn off sync on this device
            </button>
          </div>
        ) : linking ? (
          <div className="space-y-3">
            <p className="text-sm text-ink">Enter the vault key from your other device. This device will load that vault, replacing what&apos;s currently here.</p>
            <input
              value={linkKey}
              onChange={(e) => setLinkKey(e.target.value)}
              placeholder="word-word-word-…-1234"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-xl border border-line bg-surface2 px-4 py-3 font-mono text-sm text-ink focus:border-green focus:outline-none"
            />
            <div className="flex gap-2">
              <button type="button" disabled={busy || !linkKey.trim()} onClick={onLink} className={btn}>
                {busy ? 'Connecting…' : 'Connect'}
              </button>
              <button type="button" onClick={() => { setLinking(false); setLinkKey(''); setErr(''); }} className={ghost}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Back up your recipes to the cloud and use the same vault on more than one device. No account needed — a private vault key links your devices.
            </p>
            <button type="button" disabled={busy} onClick={onEnable} className={btn}>
              {busy ? 'Setting up…' : 'Turn on cloud sync'}
            </button>
            <button type="button" onClick={() => setLinking(true)} className={ghost}>
              I already have a vault key
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
