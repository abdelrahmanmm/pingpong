import { pgTable, text, serial, integer, boolean, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Create a role enum for user types
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Updated users table with authentication fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 100 }),
  role: userRoleEnum("role").default('user').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Game stats table to track player performance
export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  gamesPlayed: integer("games_played").default(0).notNull(),
  gamesWon: integer("games_won").default(0).notNull(),
  highScore: integer("high_score").default(0).notNull(),
  lastPlayed: timestamp("last_played").defaultNow().notNull(),
});

// Session store table for persistent sessions
export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Schemas for validation with Zod
export const registerUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(100),
  password: z.string().min(8).max(100),
  displayName: z.string().max(100).optional(),
});

export const loginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Create a custom insert user schema that includes passwordHash
export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(100),
  displayName: z.string().max(100).optional(),
  passwordHash: z.string(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type GameStats = typeof gameStats.$inferSelect;
