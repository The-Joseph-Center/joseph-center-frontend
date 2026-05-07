// Simple Turso connection test — run after first deploy to verify credentials.
// Usage: tsx db/seed.ts (or transpile + node)
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const result = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
  console.log('Tables found:');
  for (const row of result.rows) {
    console.log('  -', row.name);
  }
  console.log('\nConnection OK.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
