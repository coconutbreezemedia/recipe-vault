// Optional local passcode — stored only on this device (localStorage), never sent anywhere.
const STORAGE_KEY = 'rv_pin';

interface PinRecord {
  salt: string; // hex
  hash: string; // hex
}

/** Convert an ArrayBuffer to a lowercase hex string. */
function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Convert a hex string to a Uint8Array. */
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Compute SHA-256 of the concatenated bytes and return hex. */
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}

/** Concatenate two Uint8Arrays into a new buffer. */
function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export function isPinSet(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function setPin(pin: string): Promise<void> {
  if (typeof localStorage === 'undefined' || typeof crypto === 'undefined') return;

  // 16-byte random salt.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await sha256Hex(concatBytes(salt, new TextEncoder().encode(pin)));

  const record: PinRecord = { salt: toHex(salt.buffer), hash };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (typeof localStorage === 'undefined' || typeof crypto === 'undefined') return false;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  let record: PinRecord;
  try {
    record = JSON.parse(raw) as PinRecord;
  } catch {
    return false;
  }

  if (typeof record.salt !== 'string' || typeof record.hash !== 'string') return false;

  const saltBytes = fromHex(record.salt);
  const computed = await sha256Hex(concatBytes(saltBytes, new TextEncoder().encode(pin)));

  // Constant-time comparison over equal-length hex strings: no early return.
  if (computed.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ record.hash.charCodeAt(i);
  }
  return diff === 0;
}

export function clearPin(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
