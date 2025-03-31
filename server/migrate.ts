import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../shared/schema";

// Migration script to create database tables
async function main() {
  // Get the database connection string from environment variables
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Creating SQL connection...');
  const client = postgres(databaseUrl, {
    max: 10, // Maximum number of connections
  });
  
  console.log('Creating Drizzle client...');
  const db = drizzle(client, { schema });

  console.log('Running migrations...');
  try {
    // Create schema from schema definitions
    await db.execute(`CREATE SCHEMA IF NOT EXISTS public;`);
    
    // Create user_role enum type if it doesn't exist
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name VARCHAR(100),
        role user_role NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );
    `);

    // Create game_stats table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        games_played INTEGER DEFAULT 0 NOT NULL,
        games_won INTEGER DEFAULT 0 NOT NULL,
        high_score INTEGER DEFAULT 0 NOT NULL,
        last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create sessions table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();