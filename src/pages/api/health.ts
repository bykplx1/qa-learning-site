import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { db } from '../../db/index';

export const prerender = false;

export const GET: APIRoute = async () => {
  const timestamp = new Date().toISOString();

  try {
    await db.execute(sql`SELECT 1`);
    return new Response(
      JSON.stringify({ status: 'ok', db: 'reachable', timestamp }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ status: 'error', db: 'unreachable', timestamp }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }
};
