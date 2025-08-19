import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse DATABASE_URL safely to handle special characters in password
function parseSupabaseUrl(url: string) {
  // Extract components manually to handle special characters
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  const [, username, password, host, port, database] = match;
  
  return {
    host,
    port: parseInt(port),
    database,
    username,
    password: decodeURIComponent(password), // Decode any URL-encoded characters
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 60,
  };
}

const connectionString = process.env.DATABASE_URL;
const connectionConfig = parseSupabaseUrl(connectionString);
const client = postgres(connectionConfig);
export const db = drizzle(client, { schema });