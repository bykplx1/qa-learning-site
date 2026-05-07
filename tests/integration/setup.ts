import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set for integration tests');
}

process.env.BETTER_AUTH_SECRET ??= 'test-secret-at-least-32-bytes-long-aaaaaaaaa';
process.env.BETTER_AUTH_URL ??= 'http://localhost:4321';
process.env.GITHUB_CLIENT_ID ??= 'test-client-id';
process.env.GITHUB_CLIENT_SECRET ??= 'test-client-secret';
process.env.GOOGLE_CLIENT_ID ??= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ??= 'test-google-client-secret';

const migrationClient = postgres(databaseUrl, { max: 1, prepare: false });
const migrationDb = drizzle(migrationClient);

beforeAll(async () => {
  await migrate(migrationDb, { migrationsFolder: './src/db/migrations' });
});

afterEach(async () => {
  await migrationDb.execute(sql`TRUNCATE TABLE accounts, sessions, verifications, lesson_views, lessons_meta, users RESTART IDENTITY CASCADE`);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await migrationClient.end();
});
