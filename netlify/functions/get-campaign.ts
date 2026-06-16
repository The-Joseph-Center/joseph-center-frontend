import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client';

// GET /.netlify/functions/get-campaign?slug=<slug>
// Returns the active campaign matching the slug, or 404 if none.

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
  const slug = event.queryStringParameters?.slug?.trim();
  if (!slug) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'slug query parameter required' }) };
  }

  try {
    const result = await turso.execute({
      sql: `SELECT id, name, slug, description, goal_cents, raised_cents,
                   program_id, show_progress, start_date, end_date
            FROM campaigns
            WHERE slug = ? AND active = 1
            LIMIT 1`,
      args: [slug],
    });
    if (result.rows.length === 0) {
      return { statusCode: 404, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Campaign not found' }) };
    }
    const row = result.rows[0]!;
    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        goal_cents: row.goal_cents,
        raised_cents: row.raised_cents,
        program_id: row.program_id,
        show_progress: row.show_progress === 1,
        start_date: row.start_date,
        end_date: row.end_date,
      }),
    };
  } catch (err) {
    console.error('get-campaign error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Failed to load campaign' }) };
  }
};
