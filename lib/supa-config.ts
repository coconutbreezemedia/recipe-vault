const FALLBACK_URL = '';
const FALLBACK_ANON = '';

export const SUPA_URL: string =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;

export const SUPA_ANON_KEY: string =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_ANON;

export function isSyncConfigured(): boolean {
  return SUPA_URL.length > 0 && SUPA_ANON_KEY.length > 0;
}
