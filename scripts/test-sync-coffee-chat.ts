// Local test runner for sync-coffee-chat.
//
// Loads frontend/.env into process.env, then calls the function handler
// directly and prints the result. No Netlify CLI required.
//
// Run from the frontend/ directory:
//   pnpm dlx tsx scripts/test-sync-coffee-chat.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Load .env into process.env ────────────────────────────────────────────
const envPath = resolve(import.meta.dirname, '..', '.env');
const envRaw = readFileSync(envPath, 'utf8');

for (const line of envRaw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  const key = line.slice(0, eq).trim();
  let value = line.slice(eq + 1).trim();
  // Strip surrounding quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (key && process.env[key] === undefined) {
    process.env[key] = value;
  }
}

// ─── Sanity-check the env ──────────────────────────────────────────────────
const requiredVars = [
  'YOUTUBE_API_KEY',
  'COFFEE_CHAT_PLAYLIST_ID',
  'VITE_SANITY_PROJECT_ID',
  'VITE_SANITY_DATASET',
  'SANITY_WRITE_TOKEN',
];

const missing = requiredVars.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  console.error(`Set them in frontend/.env and re-run.`);
  process.exit(1);
}

console.log('Env loaded:');
console.log(`  Dataset: ${process.env.VITE_SANITY_DATASET}`);
console.log(`  Playlist: ${process.env.COFFEE_CHAT_PLAYLIST_ID}`);
console.log('');

// ─── Invoke the handler ────────────────────────────────────────────────────
const { handler } = await import('../netlify/functions/sync-coffee-chat.ts');

const mockEvent = {} as any;
const mockContext = {} as any;
const start = Date.now();

const result = await (handler as any)(mockEvent, mockContext, () => {});
const ms = Date.now() - start;

console.log(`Status: ${result.statusCode} (${ms}ms)`);
console.log('Response body:');
try {
  console.log(JSON.stringify(JSON.parse(result.body), null, 2));
} catch {
  console.log(result.body);
}
