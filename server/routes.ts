import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { authService } from "./auth";
import { loginUserSchema, registerUserSchema } from "../shared/schema";
import { ZodError } from "zod";
import 'express-session';
import { storage } from "./storage";

// Declare module to extend express-session with our user type
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role?: string;
      [key: string]: any;
    };
  }
}

// Type definition for authenticated requests
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role?: string;
    [key: string]: any;
  };
}

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // If user is not authenticated in the session
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  
  // Cast to AuthenticatedRequest and add user info
  (req as AuthenticatedRequest).user = req.session.user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Validate request body against schema
      const userData = registerUserSchema.parse(req.body);
      
      // Register the user
      const result = await authService.registerUser(userData);
      
      if (result.success && result.user) {
        // Save user in session
        if (req.session) {
          req.session.user = result.user;
        }
        
        return res.status(201).json({
          message: "User registered successfully",
          user: result.user
        });
      } else {
        return res.status(400).json({ error: result.error });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      // Validate request body against schema
      const credentials = loginUserSchema.parse(req.body);
      
      // Attempt to log in the user
      const result = await authService.loginUser(credentials);
      
      if (result.success && result.user) {
        // Save user in session
        if (req.session) {
          req.session.user = result.user;
        }
        
        return res.status(200).json({
          message: "Login successful",
          user: result.user
        });
      } else {
        return res.status(401).json({ error: result.error });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });
  
  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(200).json({ user: req.user });
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    // Destroy the session
    req.session?.destroy((err: Error | null) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      
      res.clearCookie('connect.sid'); // Clear the session cookie
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Game stats and leaderboard routes
  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const leaderboard = await storage.getLeaderboard(limit);
      return res.status(200).json({ leaderboard });
    } catch (error) {
      console.error("Leaderboard error:", error);
      return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
  
  app.get('/api/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const stats = await storage.getGameStats(req.user.id);
      return res.status(200).json({ stats });
    } catch (error) {
      console.error("Stats error:", error);
      return res.status(500).json({ error: "Failed to fetch game stats" });
    }
  });
  
  app.post('/api/stats/update', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Extract stats from request body
      const { 
        gamesPlayed, 
        gamesWon, 
        highScore 
      } = req.body;
      
      // Only update fields that are present in the request
      const updateData: Record<string, any> = {};
      if (gamesPlayed !== undefined) updateData.gamesPlayed = gamesPlayed;
      if (gamesWon !== undefined) updateData.gamesWon = gamesWon;
      if (highScore !== undefined) updateData.highScore = highScore;
      
      // Update stats
      const updatedStats = await storage.updateGameStats(req.user.id, updateData);
      
      if (!updatedStats) {
        return res.status(500).json({ error: "Failed to update game stats" });
      }
      
      return res.status(200).json({ 
        message: "Game stats updated successfully",
        stats: updatedStats
      });
    } catch (error) {
      console.error("Stats update error:", error);
      return res.status(500).json({ error: "Failed to update game stats" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
