import type { AppState } from '@/lib/types';

/**
 * Serialize the full AppState to pretty JSON and trigger a browser download
 * named `recipe-vault-backup-YYYY-MM-DD.json`. No-op during SSR.
 */
export function downloadBackup(state: AppState): void {
  if (typeof document === 'undefined') return;

  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const filename = `recipe-vault-backup-${yyyy}-${mm}-${dd}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke on the next tick — revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Validate that a parsed object matches the structural requirements of AppState:
 * an object with a numeric `version` and arrays for `recipes`, `plan`, `grocery`.
 */
function isAppStateShape(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.recipes) &&
    Array.isArray(v.plan) &&
    Array.isArray(v.grocery)
  );
}

/**
 * Read a backup File, parse its JSON contents, and validate the shape.
 * Throws if the file is not a valid Recipe Vault backup.
 */
export async function readBackupFile(file: File): Promise<AppState> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Not a valid Recipe Vault backup file.');
  }

  if (!isAppStateShape(parsed)) {
    throw new Error('Not a valid Recipe Vault backup file.');
  }

  return parsed;
}
