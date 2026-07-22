// Public client config for builds without env vars (GitHub Pages).
// The anon key is designed to be public; access control is server-side RLS.
const FALLBACK_URL = 'https://hsccezysmpaspvfxxaoa.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzY2NlenlzbXBhc3B2Znh4YW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MTg0NDgsImV4cCI6MjEwMDI5NDQ0OH0.5oS6zh323HqmAqi_1cEWI-2GQhKUmFgymtjcq1udbUc';

export const SUPA_URL: string =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;

export const SUPA_ANON_KEY: string =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_ANON;

export function isSyncConfigured(): boolean {
  return SUPA_URL.length > 0 && SUPA_ANON_KEY.length > 0;
}
