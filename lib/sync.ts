import type { AppState, Recipe, PlanEntry, GroceryItem } from '@/lib/types';
import { SUPA_URL, SUPA_ANON_KEY, isSyncConfigured } from '@/lib/supa-config';

const DB_NAME = 'recipe-vault';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const META_KEY = 'syncMeta';
const SHADOW_KEY = 'syncShadow';

type SyncKind = 'recipe' | 'plan' | 'grocery';
type SyncKey = `${SyncKind}:${string}`;

interface SyncMeta {
  key: string | null;
  cursor: string | null;
  stamps: Record<string, string>;
  tombstones: Record<string, string>;
  dirty: string[];
  lastSync: string | null;
}

// Keyed by SyncKind so shadow[kind] lookups line up with record kinds.
interface ShadowState {
  recipe: Record<string, Recipe>;
  plan: Record<string, PlanEntry>;
  grocery: Record<string, GroceryItem>;
}

type StatusListener = (status: SyncStatus) => void;

interface SyncStatus {
  enabled: boolean;
  lastSync: string | null;
  pending: number;
}

type GetState = () => AppState | null;
type ApplyState = (state: AppState) => void | Promise<void>;

let getState: GetState = () => null;
let applyState: ApplyState = () => {};
let dbPromise: Promise<IDBDatabase> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let statusListeners: Set<StatusListener> = new Set();
let currentStatus: SyncStatus = { enabled: false, lastSync: null, pending: 0 };
let onlineListener: (() => void) | null = null;

const WORD_LIST: string[] = [
  'apple', 'bread', 'cream', 'dance', 'earth', 'fruit', 'globe', 'heart',
  'image', 'jelly', 'knife', 'lemon', 'mango', 'noble', 'ocean', 'piano',
  'queen', 'river', 'stone', 'table', 'ultra', 'vivid', 'water', 'xerox',
  'yacht', 'zebra', 'amber', 'brave', 'cloud', 'daisy', 'ember', 'frost',
  'grape', 'honey', 'ivory', 'jolly', 'karma', 'lunar', 'maple', 'novel',
  'opal', 'pearl', 'quilt', 'raven', 'sugar', 'tiger', 'unity', 'vapor',
  'whale', 'xylo', 'yodel', 'zest', 'arch', 'blaze', 'coral', 'dune',
  'echo', 'fern', 'glow', 'haze', 'iris', 'jade', 'kelp', 'lotus',
  'mint', 'nest', 'onyx', 'plum', 'quartz', 'rose', 'sage', 'thorn',
  'umber', 'vine', 'willow', 'xenon', 'yarrow', 'zinnia', 'aster', 'birch',
  'cedar', 'dill', 'elder', 'fennel', 'ginger', 'hazelnut', 'indigo', 'juniper',
  'kale', 'leek', 'macadamia', 'nutmeg', 'oregano', 'parsley', 'quince', 'radish',
  'sesame', 'thyme', 'urgency', 'vanilla', 'wasabi', 'xanthic', 'yam', 'zucchini',
  'almond', 'basil', 'chive', 'dandelion', 'endive', 'fig', 'guava', 'horseradish',
  'iceberg', 'jicama', 'kohlrabi', 'lemongrass', 'marjoram', 'neem', 'olive', 'pecan',
  'quinoa', 'rosemary', 'saffron', 'tarragon', 'uva', 'valerian', 'watercress', 'ximenia',
  'yeast', 'zucchini', 'avocado', 'butter', 'cheese', 'dough', 'egg', 'flour',
  'ginger', 'honey', 'ice', 'jam', 'kefir', 'lime', 'milk', 'nectar',
  'oat', 'pepper', 'quark', 'rice', 'salt', 'tofu', 'udon', 'vinegar',
  'wheat', 'xylitol', 'yogurt', 'zest', 'artichoke', 'beet', 'carrot', 'daikon',
  'eggplant', 'fava', 'garlic', 'habanero', 'iceplant', 'jabanero', 'kabocha', 'lemon',
  'mushroom', 'onion', 'pea', 'quince', 'radicchio', 'spinach', 'turnip', 'utah',
  'vavilov', 'wasabi', 'xylem', 'yam', 'zucchini', 'arugula', 'bokchoy', 'chard',
  'dulse', 'escarole', 'frisee', 'galangal', 'horseradish', 'iceberg', 'jalapeno', 'kale',
  'leek', 'mustard', 'nopales', 'okra', 'pumpkin', 'quinoa', 'rutabaga', 'shallot',
  'tomatillo', 'upland', 'vermouth', 'watermelon', 'xanthan', 'yellow', 'zucchini', 'almond',
  'barley', 'cashew', 'durum', 'emmer', 'farro', 'grain', 'hazelnut', 'indigo',
  'jobberry', 'kamut', 'lentil', 'millet', 'nori', 'oyster', 'pistachio', 'quern',
  'rye', 'sorghum', 'teff', 'udon', 'valencia', 'walnut', 'xanthan', 'yeast',
  'ziti', 'arborio', 'bomba', 'carnaroli', 'dal', 'escarole', 'fonio', 'gram',
  'hominy', 'ivory', 'jasmine', 'koshihikari', 'legume', 'mung', 'noodle', 'orzo',
  'pinto', 'quinoa', 'risotto', 'spelt', 'tapioca', 'urgulla', 'vermicelli', 'wheat',
  'xanthan', 'yellow', 'ziti', 'amber', 'azure', 'bronze', 'crimson', 'denim',
  'ebony', 'flax', 'golden', 'hazel', 'indigo', 'jade', 'khaki', 'lavender',
  'mahogany', 'navy', 'olive', 'plum', 'quartz', 'ruby', 'sienna', 'tan',
  'umber', 'violet', 'wheat', 'xanadu', 'yellow', 'zinc'
];

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });

  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    // No-op when IndexedDB unavailable
  }
}

async function getMeta(): Promise<SyncMeta | null> {
  return idbGet<SyncMeta>(META_KEY);
}

async function setMeta(meta: SyncMeta): Promise<void> {
  await idbSet(META_KEY, meta);
}

function nowISO(): string {
  return new Date().toISOString();
}

function emptyMeta(): SyncMeta {
  return {
    key: null,
    cursor: null,
    stamps: {},
    tombstones: {},
    dirty: [],
    lastSync: null,
  };
}

function toShadow(state: AppState): ShadowState {
  return {
    recipe: Object.fromEntries(state.recipes.map(r => [r.id, r])),
    plan: Object.fromEntries(state.plan.map(p => [p.id, p])),
    grocery: Object.fromEntries(state.grocery.map(g => [g.id, g])),
  };
}

function fromShadow(shadow: ShadowState): AppState {
  return {
    version: 1,
    recipes: Object.values(shadow.recipe),
    plan: Object.values(shadow.plan),
    grocery: Object.values(shadow.grocery),
  };
}

function getKindArray(state: AppState, kind: SyncKind): Array<{ id: string }> {
  switch (kind) {
    case 'recipe': return state.recipes;
    case 'plan': return state.plan;
    case 'grocery': return state.grocery;
  }
}

function makeSyncKey(kind: SyncKind, id: string): SyncKey {
  return `${kind}:${id}` as SyncKey;
}

function parseSyncKey(key: string): { kind: SyncKind; id: string } | null {
  const idx = key.indexOf(':');
  if (idx === -1) return null;
  const kind = key.substring(0, idx) as SyncKind;
  const id = key.substring(idx + 1);
  if (!['recipe', 'plan', 'grocery'].includes(kind)) return null;
  return { kind, id };
}

function emitStatus(): void {
  for (const cb of statusListeners) {
    try {
      cb({ ...currentStatus });
    } catch {
      // ignore listener errors
    }
  }
}

async function refreshStatus(): Promise<void> {
  const meta = await getMeta();
  if (meta) {
    currentStatus = {
      enabled: meta.key !== null,
      lastSync: meta.lastSync,
      pending: meta.dirty.length,
    };
  } else {
    currentStatus = { enabled: false, lastSync: null, pending: 0 };
  }
  emitStatus();
}

async function fetchRpc(fn: string, body: Record<string, unknown>): Promise<unknown> {
  if (!isSyncConfigured()) {
    throw new Error('Sync not configured');
  }
  const url = `${SUPA_URL}/rest/v1/rpc/${fn}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_ANON_KEY,
        'Authorization': `Bearer ${SUPA_ANON_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`RPC ${fn} failed: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function generateVaultKey(): string {
  const words: string[] = [];
  const wordIndices = new Uint32Array(8);
  crypto.getRandomValues(wordIndices);
  for (let i = 0; i < 8; i++) {
    words.push(WORD_LIST[wordIndices[i] % WORD_LIST.length]);
  }

  const digitsArr = new Uint8Array(4);
  crypto.getRandomValues(digitsArr);
  const digits = Array.from(digitsArr, b => (b % 10).toString()).join('');

  return `${words.join('-')}-${digits}`;
}

export async function enableSync(): Promise<string> {
  const key = generateVaultKey();

  try {
    await fetchRpc('rv_create_vault', { p_key: key });
  } catch (err) {
    throw new Error('Could not reach the sync server. Check your connection and try again.');
  }

  const meta = emptyMeta();
  meta.key = key;
  await setMeta(meta);

  const state = getState();
  if (state) {
    const shadow = toShadow(state);
    await idbSet(SHADOW_KEY, shadow);

    for (const kind of ['recipe', 'plan', 'grocery'] as SyncKind[]) {
      const arr = getKindArray(state, kind);
      const stamp = nowISO();
      for (const item of arr) {
        const sk = makeSyncKey(kind, item.id);
        meta.stamps[sk] = stamp;
        meta.dirty.push(sk);
      }
    }
    await setMeta(meta);
  }

  await pushDirty();
  await refreshStatus();
  return key;
}

interface PullRecord {
  kind: string;
  local_id: string;
  data: unknown;
  updated_at: string;
  deleted: boolean;
}

interface PullResponse {
  records?: PullRecord[];
  cursor?: string;
}

async function mergePulledRecords(
  records: PullRecord[],
  cursor: string | null
): Promise<void> {
  const meta = await getMeta();
  if (!meta || !meta.key) return;

  const state = getState();
  if (!state) return;

  const shadow = (await idbGet<ShadowState>(SHADOW_KEY)) ?? toShadow(state);
  let changed = false;

  for (const rec of records) {
    const kind = rec.kind as SyncKind;
    if (!['recipe', 'plan', 'grocery'].includes(kind)) continue;

    const sk = makeSyncKey(kind, rec.local_id);
    const localStamp = meta.stamps[sk] ?? null;

    if (rec.deleted) {
      if (shadow[kind][rec.local_id]) {
        delete shadow[kind][rec.local_id];
        changed = true;
      }
      meta.tombstones[sk] = rec.updated_at;
      if (localStamp && localStamp < rec.updated_at) {
        delete meta.stamps[sk];
      }
    } else {
      if (localStamp && localStamp >= rec.updated_at) {
        continue;
      }
      shadow[kind][rec.local_id] = rec.data as (Recipe | PlanEntry | GroceryItem);
      meta.stamps[sk] = rec.updated_at;
      changed = true;
    }
  }

  meta.cursor = cursor;
  meta.lastSync = nowISO();
  await setMeta(meta);

  if (changed) {
    const newState = fromShadow(shadow);
    await idbSet(SHADOW_KEY, shadow);
    await applyState(newState);
  }
}

export async function linkDevice(key: string): Promise<void> {
  try {
    const result = await fetchRpc('rv_pull', { p_key: key, p_since: null }) as PullResponse;
    if (!result || !result.records) {
      throw new Error('invalid key');
    }

    // Linking means this device JOINS the existing vault: local state is
    // replaced by the cloud copy. Merging instead would duplicate the seed
    // recipes on every fresh install (different local ids for the same data).
    const shadow: ShadowState = { recipe: {}, plan: {}, grocery: {} };
    const meta = emptyMeta();
    meta.key = key;
    meta.cursor = result.cursor ?? null;
    for (const rec of result.records) {
      const kind = rec.kind as SyncKind;
      if (!['recipe', 'plan', 'grocery'].includes(kind)) continue;
      const sk = makeSyncKey(kind, rec.local_id);
      if (rec.deleted) {
        meta.tombstones[sk] = rec.updated_at;
      } else {
        shadow[kind][rec.local_id] = rec.data as Recipe & PlanEntry & GroceryItem;
        meta.stamps[sk] = rec.updated_at;
      }
    }
    meta.lastSync = nowISO();
    await idbSet(SHADOW_KEY, shadow);
    await setMeta(meta);
    await applyState(fromShadow(shadow));
    await refreshStatus();
  } catch (err) {
    throw err instanceof Error && err.message.includes('key')
      ? err
      : new Error('invalid key');
  }
}

export async function onLocalStateChange(newState: AppState): Promise<void> {
  const meta = await getMeta();
  if (!meta || !meta.key) return;

  const shadow = (await idbGet<ShadowState>(SHADOW_KEY)) ?? toShadow(newState);
  const newShadow = toShadow(newState);
  const stamp = nowISO();

  for (const kind of ['recipe', 'plan', 'grocery'] as SyncKind[]) {
    const oldMap = shadow[kind];
    const newMap = newShadow[kind];

    for (const id of Object.keys(newMap)) {
      const oldItem = oldMap[id];
      const newItem = newMap[id];
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
        const sk = makeSyncKey(kind, id);
        meta.stamps[sk] = stamp;
        delete meta.tombstones[sk];
        if (!meta.dirty.includes(sk)) {
          meta.dirty.push(sk);
        }
      }
    }

    for (const id of Object.keys(oldMap)) {
      if (!(id in newMap)) {
        const sk = makeSyncKey(kind, id);
        meta.tombstones[sk] = stamp;
        if (!meta.dirty.includes(sk)) {
          meta.dirty.push(sk);
        }
      }
    }
  }

  await idbSet(SHADOW_KEY, newShadow);
  await setMeta(meta);

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushDirty().catch(() => {});
  }, 2000);

  await refreshStatus();
}

export async function pushDirty(): Promise<void> {
  const meta = await getMeta();
  if (!meta || !meta.key || meta.dirty.length === 0) return;

  const state = getState();
  if (!state) return;

  const changes: Array<{
    kind: string;
    local_id: string;
    data: unknown;
    updated_at: string;
    deleted: boolean;
  }> = [];

  for (const dirtyKey of meta.dirty) {
    const parsed = parseSyncKey(dirtyKey);
    if (!parsed) continue;

    const { kind, id } = parsed;
    const tombstone = meta.tombstones[dirtyKey];

    if (tombstone) {
      changes.push({
        kind,
        local_id: id,
        data: null,
        updated_at: tombstone,
        deleted: true,
      });
    } else {
      const arr = getKindArray(state, kind) as Array<{ id: string }>;
      const item = arr.find(r => r.id === id);
      if (item) {
        const stamp = meta.stamps[dirtyKey] ?? nowISO();
        changes.push({
          kind,
          local_id: id,
          data: item,
          updated_at: stamp,
          deleted: false,
        });
      }
    }
  }

  if (changes.length === 0) {
    meta.dirty = [];
    await setMeta(meta);
    return;
  }

  try {
    // rv_push returns a bare timestamptz JSON string (the server cursor).
    const result = await fetchRpc('rv_push', {
      p_key: meta.key,
      p_changes: changes,
    }) as string | null;

    meta.dirty = [];
    if (typeof result === 'string' && result) {
      meta.cursor = result;
    }
    meta.lastSync = nowISO();
    await setMeta(meta);
  } catch {
    // Network error: keep dirty flags for retry
  }

  await refreshStatus();
}

export async function pullAndMerge(): Promise<void> {
  const meta = await getMeta();
  if (!meta || !meta.key) return;

  try {
    const result = await fetchRpc('rv_pull', {
      p_key: meta.key,
      p_since: meta.cursor,
    }) as PullResponse;

    if (result?.records) {
      await mergePulledRecords(result.records, result.cursor ?? meta.cursor);
    }
  } catch {
    // Network error swallowed
  }

  await refreshStatus();
}

export async function syncNow(): Promise<void> {
  await pullAndMerge();
  await pushDirty();
}

export async function disableSync(): Promise<void> {
  await setMeta(emptyMeta());
  await idbSet(SHADOW_KEY, null);
  await refreshStatus();
}

export function getSyncStatus(): {
  enabled: boolean;
  lastSync: string | null;
  pending: number;
  subscribe: (cb: StatusListener) => () => void;
} {
  return {
    ...currentStatus,
    subscribe: (cb: StatusListener) => {
      statusListeners.add(cb);
      cb({ ...currentStatus });
      return () => {
        statusListeners.delete(cb);
      };
    },
  };
}

export function initSync(stateGetter: GetState, stateApplier: ApplyState): void {
  getState = stateGetter;
  applyState = stateApplier;

  if (typeof window !== 'undefined') {
    if (onlineListener) {
      window.removeEventListener('online', onlineListener);
    }
    onlineListener = () => {
      syncNow().catch(() => {});
    };
    window.addEventListener('online', onlineListener);

    refreshStatus().then(() => {
      if (currentStatus.enabled) {
        syncNow().catch(() => {});
      }
    });
  }
}
