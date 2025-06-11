import pg from 'pg';
const { Pool } = pg;
// import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import { drizzle } from 'drizzle-orm/node-postgres';


dotenv.config();

// neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
