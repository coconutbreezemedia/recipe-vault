// Writes one timestamp through rv_keepalive so a free-tier Supabase
// project records real database activity. Reads the public project URL
// and anon key already embedded in lib/supa-config.ts unless overridden.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = readFileSync(join(root, 'lib/supa-config.ts'), 'utf8');

function fromConfig(name) {
  const match = config.match(new RegExp(`const ${name} = '([^']+)'`));
  if (!match) throw new Error(`Could not read ${name} from lib/supa-config.ts`);
  return match[1];
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || fromConfig('FALLBACK_URL')).replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fromConfig('FALLBACK_ANON');

const response = await fetch(`${url}/rest/v1/rpc/rv_keepalive`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
  body: '{}',
});

const body = await response.text();
if (!response.ok) {
  if (body.includes('PGRST202') || body.includes('Could not find the function')) {
    console.error('Supabase answered, but rv_keepalive is not installed.');
    console.error('Restore the project if it is paused, then run supabase/keepalive.sql in the SQL editor.');
  } else if (response.status === 540 || /paused|inactive/i.test(body)) {
    console.error('Supabase project looks paused. Restore it in the dashboard, then re-run this check.');
  } else {
    console.error(`Keepalive failed (${response.status}).`);
  }
  console.error(body.slice(0, 500));
  process.exit(1);
}

console.log(`Keepalive wrote ${body.trim()} on ${url}`);
