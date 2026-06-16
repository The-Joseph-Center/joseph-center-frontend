import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client';

// GET /.netlify/functions/get-active-spotlight
// Returns the most recent active spotlight whose date range covers today,
// or 204 if there's nothing to show.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const result = await turso.execute({
      sql: `SELECT id, platform_name, headline, description, link_url
            FROM spotlights
            WHERE active = 1
              AND (start_date IS NULL OR start_date <= ?)
              AND (end_date   IS NULL OR end_date   >= ?)
            ORDER BY created_at DESC
            LIMIT 1`,
      args: [today, today],
    });
    if (result.rows.length === 0) {
      return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }
    const row = result.rows[0]!;
    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({
        id: row.id,
        platform_name: row.platform_name,
        headline: row.headline,
        description: row.description,
        link_url: row.link_url,
      }),
    };
  } catch (err) {
    console.error('get-active-spotlight error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Failed to load spotlight' }) };
  }
};
