import type { Handler } from '@netlify/functions';
import { createClient } from '@sanity/client';
import { createClient as createTursoClient } from '@libsql/client/web';
import { capStatus, countRecorded, type FormCap } from './_lib/form-cap';

/**
 * The form, and whether it still has room.
 *
 * Both in one answer on purpose. A capped form's state is not a field anybody
 * sets — it is the sum of what has been submitted, which lives in Turso while
 * the form definition lives in Sanity. Asking Sanity alone cannot tell you
 * whether Angel Tree is full, and a page that renders an open form over a full
 * one invites somebody to fill it in and be refused on submit.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const turso = createTursoClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const sanity = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID!,
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: process.env.VITE_SANITY_API_VERSION || '2024-01-01',
  useCdn: true,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const slug = event.queryStringParameters?.slug;
    if (!slug) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'slug query param is required' }) };
    }

    const form = await sanity.fetch<{ cap?: FormCap } | null>(
      `*[_type == "dynamicForm" && slug.current == $slug][0]{
        title, slug, active, activeDates, description, fields, successMessage, cap
      }`,
      { slug }
    );

    if (!form) {
      return { statusCode: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Form not found' }) };
    }

    // Only for a form that has a cap set. An uncapped form should not pay for
    // a database round trip, and most of them never will have one.
    let capacity = capStatus(form.cap, 0);
    if (capacity.capped) {
      try {
        const { recorded } = await countRecorded(turso, slug, form.cap?.countField);
        capacity = capStatus(form.cap, recorded);
      } catch (dbErr) {
        // A form that cannot be counted stays open. Refusing everyone because
        // the database is unreachable would turn an outage into a closed
        // sign-up, and submit-dynamic-form checks again anyway.
        console.error('get-form: could not count submissions, leaving the form open:', dbErr);
        capacity = { ...capacity, capped: false, full: false };
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        // The count moves with every submission, so this must not be cached.
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ ...form, capacity }),
    };
  } catch (err) {
    console.error('get-form error:', err);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to fetch form' }) };
  }
};
