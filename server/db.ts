import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Get the database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the SQL connection with postgres.js instead of neon-serverless
// This is more compatible with the current setup
const client = postgres(databaseUrl, {
  max: 10, // Maximum number of connections
});

// Create the Drizzle ORM client with the schema
export const db = drizzle(client, { schema });

// Helper function to handle common database errors
export async function handleDbError<T>(operation: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    console.error("Database error:", error);
    return [null, error as Error];
  }
}