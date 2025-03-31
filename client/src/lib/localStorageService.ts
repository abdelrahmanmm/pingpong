/**
 * Local Storage Service
 * 
 * This service provides client-side data persistence for the GitHub Pages deployment.
 * It replaces server-side functionality by storing user data and game statistics
 * in the browser's localStorage.
 */

// Types for local storage data
export interface LocalUser {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  password: string; // Not secure for real apps, but needed for demo
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface LocalGameStats {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  gamesPlayed: number;
  gamesWon: number;
  highScore: number;
  lastPlayed: string;
}

// Storage keys
const USERS_KEY = 'pingpong_users';
const CURRENT_USER_KEY = 'pingpong_current_user';
const GAME_STATS_KEY = 'pingpong_game_stats';

// Helper functions
const getUsers = (): LocalUser[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

const saveUsers = (users: LocalUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getGameStats = (): LocalGameStats[] => {
  const statsJson = localStorage.getItem(GAME_STATS_KEY);
  return statsJson ? JSON.parse(statsJson) : [];
};

const saveGameStats = (stats: LocalGameStats[]) => {
  localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
};

const getCurrentUser = (): LocalUser | null => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

const setCurrentUser = (user: LocalUser | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Main service functions
export const localStorageService = {
  /**
   * Register a new user
   */
  register: async (username: string, email: string, password: string, displayName?: string): Promise<{ success: boolean; user?: Omit<LocalUser, 'password'>; error?: string }> => {
    try {
      const users = getUsers();
      
      // Check if username already exists
      if (users.some(u => u.username === username)) {
        return { success: false, error: 'Username already exists' };
      }
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        return { success: false, error: 'Email already exists' };
      }
      
      // Create new user
      const newUser: LocalUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        email,
        displayName,
        password, // In a real app, this would be hashed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      
      // Add user to storage
      users.push(newUser);
      saveUsers(users);
      
      // Set as current user
      setCurrentUser(newUser);
      
      // Create initial game stats
      const stats = getGameStats();
      const newStats: LocalGameStats = {
        id: stats.length > 0 ? Math.max(...stats.map(s => s.id)) + 1 : 1,
        userId: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        gamesPlayed: 0,
        gamesWon: 0,
        highScore: 0,
        lastPlayed: new Date().toISOString()
      };
      stats.push(newStats);
      saveGameStats(stats);
      
      // Return success without password
      const { password: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Failed to register user' };
    }
  },
  
  /**
   * Login a user
   */
  login: async (username: string, password: string): Promise<{ success: boolean; user?: Omit<LocalUser, 'password'>; error?: string }> => {
    try {
      const users = getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Set as current user
      setCurrentUser(user);
      
      // Return success without password
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to login' };
    }
  },
  
  /**
   * Logout current user
   */
  logout: async (): Promise<{ success: boolean }> => {
    setCurrentUser(null);
    return { success: true };
  },
  
  /**
   * Get current user data
   */
  getCurrentUser: async (): Promise<{ user: Omit<LocalUser, 'password'> | null }> => {
    const user = getCurrentUser();
    
    if (!user) {
      return { user: null };
    }
    
    // Return without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  },
  
  /**
   * Get game stats for the leaderboard
   */
  getLeaderboard: async (limit: number = 10): Promise<{ leaderboard: LocalGameStats[] }> => {
    try {
      const stats = getGameStats();
      
      // Sort by high score descending
      const sortedStats = [...stats].sort((a, b) => b.highScore - a.highScore);
      
      return { leaderboard: sortedStats.slice(0, limit) };
    } catch (error) {
      console.error('Leaderboard error:', error);
      return { leaderboard: [] };
    }
  },
  
  /**
   * Get game stats for current user
   */
  getUserStats: async (): Promise<{ stats: LocalGameStats | null }> => {
    try {
      const user = getCurrentUser();
      
      if (!user) {
        return { stats: null };
      }
      
      const stats = getGameStats();
      const userStats = stats.find(s => s.userId === user.id);
      
      return { stats: userStats || null };
    } catch (error) {
      console.error('User stats error:', error);
      return { stats: null };
    }
  },
  
  /**
   * Update game stats for current user
   */
  updateUserStats: async (data: { 
    gamesPlayed?: number; 
    gamesWon?: number; 
    highScore?: number;
  }): Promise<{ success: boolean; stats?: LocalGameStats }> => {
    try {
      const user = getCurrentUser();
      
      if (!user) {
        return { success: false };
      }
      
      const stats = getGameStats();
      let userStats = stats.find(s => s.userId === user.id);
      
      if (!userStats) {
        // Create stats if they don't exist
        userStats = {
          id: stats.length > 0 ? Math.max(...stats.map(s => s.id)) + 1 : 1,
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          gamesPlayed: 0,
          gamesWon: 0,
          highScore: 0,
          lastPlayed: new Date().toISOString()
        };
        stats.push(userStats);
      }
      
      // Update stats
      if (data.gamesPlayed !== undefined) {
        userStats.gamesPlayed = data.gamesPlayed;
      }
      
      if (data.gamesWon !== undefined) {
        userStats.gamesWon = data.gamesWon;
      }
      
      if (data.highScore !== undefined && data.highScore > userStats.highScore) {
        userStats.highScore = data.highScore;
      }
      
      userStats.lastPlayed = new Date().toISOString();
      
      // Save updated stats
      saveGameStats(stats);
      
      return { success: true, stats: userStats };
    } catch (error) {
      console.error('Update stats error:', error);
      return { success: false };
    }
  },
  
  /**
   * Initialize demo data (for GitHub Pages)
   */
  initializeDemoData: (): void => {
    // Only initialize if no data exists
    if (getUsers().length === 0) {
      // Create demo users
      const users: LocalUser[] = [
        {
          id: 1,
          username: 'player1',
          email: 'player1@example.com',
          displayName: 'Ping Master',
          password: 'password123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: 2,
          username: 'player2',
          email: 'player2@example.com',
          displayName: 'Pong Pro',
          password: 'password123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
      ];
      saveUsers(users);
      
      // Create demo stats
      const stats: LocalGameStats[] = [
        {
          id: 1,
          userId: 1,
          username: 'player1',
          displayName: 'Ping Master',
          gamesPlayed: 25,
          gamesWon: 18,
          highScore: 42,
          lastPlayed: new Date().toISOString()
        },
        {
          id: 2,
          userId: 2,
          username: 'player2',
          displayName: 'Pong Pro',
          gamesPlayed: 20,
          gamesWon: 12,
          highScore: 35,
          lastPlayed: new Date().toISOString()
        }
      ];
      saveGameStats(stats);
    }
  }
};