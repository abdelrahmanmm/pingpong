import { users, type User, type InsertUser, gameStats, type GameStats } from "../shared/schema";
import { db, handleDbError } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Storage interface for user and game data operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game stats operations
  getGameStats(userId: number): Promise<GameStats | undefined>;
  updateGameStats(userId: number, data: Partial<Omit<GameStats, 'id' | 'userId'>>): Promise<GameStats | undefined>;
  getLeaderboard(limit?: number): Promise<GameStats[]>;
}

/**
 * PostgreSQL Database Storage Implementation
 * 
 * Provides database operations for users and game statistics
 * using the Drizzle ORM with PostgreSQL.
 */
export class DbStorage implements IStorage {
  /**
   * Get a user by ID
   */
  async getUser(id: number): Promise<User | undefined> {
    const [result, error] = await handleDbError(async () => {
      return await db.select().from(users).where(
        eq(users.id, id)
      ).limit(1);
    });
    
    if (error || !result || result.length === 0) {
      return undefined;
    }
    
    return result[0];
  }

  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result, error] = await handleDbError(async () => {
      return await db.select().from(users).where(
        eq(users.username, username)
      ).limit(1);
    });
    
    if (error || !result || result.length === 0) {
      return undefined;
    }
    
    return result[0];
  }

  /**
   * Create a new user
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    // Note: Password hashing should be handled elsewhere (in auth.ts)
    const [result, error] = await handleDbError(async () => {
      return await db.insert(users).values(insertUser).returning();
    });
    
    if (error || !result || result.length === 0) {
      throw new Error("Failed to create user");
    }
    
    return result[0];
  }

  /**
   * Get game stats for a user
   */
  async getGameStats(userId: number): Promise<GameStats | undefined> {
    const [result, error] = await handleDbError(async () => {
      return await db.select().from(gameStats).where(
        eq(gameStats.userId, userId)
      ).limit(1);
    });
    
    if (error || !result || result.length === 0) {
      return undefined;
    }
    
    return result[0];
  }

  /**
   * Update a user's game stats or create if not exists
   */
  async updateGameStats(
    userId: number, 
    data: Partial<Omit<GameStats, 'id' | 'userId'>>
  ): Promise<GameStats | undefined> {
    // First check if stats exist
    const existingStats = await this.getGameStats(userId);
    
    if (existingStats) {
      // Update existing stats
      const [result, error] = await handleDbError(async () => {
        return await db.update(gameStats)
          .set({
            ...data,
            lastPlayed: new Date() // Always update last played time
          })
          .where(eq(gameStats.id, existingStats.id))
          .returning();
      });
      
      if (error || !result || result.length === 0) {
        return undefined;
      }
      
      return result[0];
    } else {
      // Create new stats
      const [result, error] = await handleDbError(async () => {
        return await db.insert(gameStats)
          .values({
            userId,
            ...data,
            lastPlayed: new Date()
          })
          .returning();
      });
      
      if (error || !result || result.length === 0) {
        return undefined;
      }
      
      return result[0];
    }
  }

  /**
   * Get leaderboard sorted by high scores
   */
  async getLeaderboard(limit: number = 10): Promise<GameStats[]> {
    const [result, error] = await handleDbError(async () => {
      return await db.select({
        id: gameStats.id,
        userId: gameStats.userId,
        username: users.username,
        displayName: users.displayName,
        gamesPlayed: gameStats.gamesPlayed,
        gamesWon: gameStats.gamesWon,
        highScore: gameStats.highScore,
        lastPlayed: gameStats.lastPlayed
      })
      .from(gameStats)
      .innerJoin(users, eq(gameStats.userId, users.id))
      .orderBy(desc(gameStats.highScore))
      .limit(limit);
    });
    
    if (error || !result) {
      return [];
    }
    
    return result;
  }
}

// Create and export a singleton instance
export const storage = new DbStorage();
