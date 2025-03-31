import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from './db';
import { storage } from './storage';
import { RegisterUser, LoginUser, insertUserSchema } from '../shared/schema';

// SALT_ROUNDS for bcrypt password hashing
const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Register a new user with email, username, and password
   */
  async registerUser(userData: RegisterUser): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }
      
      // Hash the password
      const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
      
      // Create the user record
      const user = await storage.createUser({
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        passwordHash
      });
      
      // Create initial game stats for the user
      await storage.updateGameStats(user.id, {
        gamesPlayed: 0,
        gamesWon: 0,
        highScore: 0
      });
      
      // Return sanitized user object (without password hash)
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: 'Failed to register user' };
    }
  }
  
  /**
   * Login a user with username and password
   */
  async loginUser(credentials: LoginUser): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Get user by username
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Check if user is active
      if (!user.isActive) {
        return { success: false, error: 'Account is disabled' };
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Return sanitized user object (without password hash)
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Error logging in user:', error);
      return { success: false, error: 'Login failed' };
    }
  }
  
  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<any | null> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return null;
      }
      
      // Return sanitized user object (without password hash)
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}

export const authService = new AuthService();