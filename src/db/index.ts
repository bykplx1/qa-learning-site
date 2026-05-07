import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

let _client: Sql | undefined;
let _db: PostgresJsDatabase<typeof schema> | undefined;

function getClient(): Sql {
  if (_client) return _client;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  _client = postgres(connectionString, { max: 10, prepare: false });
  return _client;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_t, prop, receiver) {
    if (!_db) _db = drizzle(getClient(), { schema });
    return Reflect.get(_db, prop, receiver);
  },
});

export { schema };
export * from './schema';
