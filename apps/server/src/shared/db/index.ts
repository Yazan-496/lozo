import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Connection pool for queries — exported so ShutdownService can call client.end()
export const client = postgres(connectionString, { ssl: 'require' });

export const db = drizzle(client, { schema });
