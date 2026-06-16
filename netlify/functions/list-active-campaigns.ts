import type { Handler } from '@netlify/functions';
import { createClient } from '@libsql/client';

// GET /.netlify/functions/list-active-campaigns
//   ?programId=<id>   → campaigns whose program_id matches (program-scoped, e.g. on /programs/golden-girls)
//   (no param)        → org-wide campaigns where program_id IS NULL (home page)
//   ?programId=any    → every active campaign regardless of program_id (admin/dashboard use)
//
// Active = active=1 AND today is within [start_date, end_date] (both bounds optional).
// Order: created_at DESC.

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

  const programId = event.queryStringParameters?.programId?.trim();
  const today = new Date().toISOString().slice(0, 10);

  let sql: string;
  let args: (string | null)[];
  if (programId === 'any') {
    sql = `SELECT id, name, slug, description, goal_cents, raised_cents, program_id,
                  show_progress, start_date, end_date
           FROM campaigns
           WHERE active = 1
             AND (start_date IS NULL OR start_date <= ?)
             AND (end_date   IS NULL OR end_date   >= ?)
           ORDER BY created_at DESC`;
    args = [today, today];
  } else if (programId) {
    sql = `SELECT id, name, slug, description, goal_cents, raised_cents, program_id,
                  show_progress, start_date, end_date
           FROM campaigns
           WHERE active = 1 AND program_id = ?
             AND (start_date IS NULL OR start_date <= ?)
             AND (end_date   IS NULL OR end_date   >= ?)
           ORDER BY created_at DESC`;
    args = [programId, today, today];
  } else {
    sql = `SELECT id, name, slug, description, goal_cents, raised_cents, program_id,
                  show_progress, start_date, end_date
           FROM campaigns
           WHERE active = 1 AND program_id IS NULL
             AND (start_date IS NULL OR start_date <= ?)
             AND (end_date   IS NULL OR end_date   >= ?)
           ORDER BY created_at DESC`;
    args = [today, today];
  }

  try {
    const result = await turso.execute({ sql, args });
    const campaigns = result.rows.map((row) => ({
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
    }));
    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ campaigns }),
    };
  } catch (err) {
    console.error('list-active-campaigns error:', err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Failed to load campaigns' }) };
  }
};
