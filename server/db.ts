import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Get the database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the SQL connection with proper configuration
const sql = neon(databaseUrl, { fullResults: true });

// Create the Drizzle ORM client with the schema
export const db = drizzle(sql, { schema });

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