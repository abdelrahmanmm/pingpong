/**
 * Power-ups System for Ping Pong Game
 * 
 * This store manages the state and logic for all game power-ups, including:
 * - Power-up types and their effects
 * - Active power-ups and their durations
 * - Power-up spawning and collection logic
 */

import { create } from 'zustand';

// Types of power-ups available in the game
export enum PowerUpType {
  // Offensive power-ups
  SPEED_BOOST = 'SPEED_BOOST',
  MULTI_BALL = 'MULTI_BALL',
  
  // Defensive power-ups
  PADDLE_EXTENDER = 'PADDLE_EXTENDER',
  SLOW_MOTION = 'SLOW_MOTION',
  
  // Disruptive power-ups
  INVISIBILITY = 'INVISIBILITY',
  SHRINK_OPPONENT = 'SHRINK_OPPONENT',
}

// Target for power-up effects
export enum PowerUpTarget {
  PLAYER = 'PLAYER',
  COMPUTER = 'COMPUTER',
  BALL = 'BALL',
  GAME = 'GAME',
}

// Power-up configuration for each type
export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  duration: number; // in milliseconds
  color: string;
  target: PowerUpTarget;
  probability: number; // Relative probability of spawning (0 - 100)
}

// Active power-up instance
export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number; // Timestamp when power-up will expire
  target: PowerUpTarget;
}

// Spawned power-up instance
export interface SpawnedPowerUp {
  id: string;
  type: PowerUpType;
  x: number; // X position on canvas
  y: number; // Y position on canvas
  radius: number; // Size of the power-up
  color: string;
}

// Power-ups state interface
interface PowerUpsState {
  // State
  activePowerUps: ActivePowerUp[];
  spawnedPowerUps: SpawnedPowerUp[];
  nextSpawnTime: number;
  
  // Configuration
  powerUpConfigs: Record<PowerUpType, PowerUpConfig>;
  spawnInterval: number; // Time between power-up spawns (ms)
  maxPowerUps: number; // Maximum number of power-ups on the canvas at once
  
  // Actions
  spawnPowerUp: (canvasWidth: number, canvasHeight: number) => void;
  collectPowerUp: (id: string, isPlayerCollecting: boolean) => PowerUpType | null;
  checkExpiredPowerUps: () => void;
  isActive: (type: PowerUpType, target: PowerUpTarget) => boolean;
  isPowerUpSpawningEnabled: boolean;
  
  // Power-up effect getters
  getBallSpeedMultiplier: () => number;
  getPlayerPaddleHeightMultiplier: () => number;
  getComputerPaddleHeightMultiplier: () => number;
  getBallOpacity: () => number;
  
  // Toggle power-up system
  enablePowerUps: () => void;
  disablePowerUps: () => void;
}

/**
 * Zustand store for managing power-ups
 */
export const usePowerUps = create<PowerUpsState>((set, get) => ({
  // Initial state
  activePowerUps: [],
  spawnedPowerUps: [],
  nextSpawnTime: 0,
  
  // Configuration of power-up types
  powerUpConfigs: {
    [PowerUpType.SPEED_BOOST]: {
      type: PowerUpType.SPEED_BOOST,
      name: 'Speed Boost',
      description: 'Increases ball speed',
      duration: 7000, // 7 seconds
      color: '#FF5733', // Orange-red
      target: PowerUpTarget.BALL,
      probability: 15,
    },
    [PowerUpType.MULTI_BALL]: {
      type: PowerUpType.MULTI_BALL,
      name: 'Multi-Ball',
      description: 'Adds extra balls',
      duration: 10000, // 10 seconds
      color: '#C70039', // Dark red
      target: PowerUpTarget.GAME,
      probability: 10,
    },
    [PowerUpType.PADDLE_EXTENDER]: {
      type: PowerUpType.PADDLE_EXTENDER,
      name: 'Paddle Extender',
      description: 'Increases your paddle size',
      duration: 8000, // 8 seconds
      color: '#33FF57', // Green
      target: PowerUpTarget.PLAYER,
      probability: 20,
    },
    [PowerUpType.SLOW_MOTION]: {
      type: PowerUpType.SLOW_MOTION,
      name: 'Slow Motion',
      description: 'Decreases ball speed',
      duration: 6000, // 6 seconds
      color: '#3498DB', // Blue
      target: PowerUpTarget.BALL,
      probability: 15,
    },
    [PowerUpType.INVISIBILITY]: {
      type: PowerUpType.INVISIBILITY,
      name: 'Invisibility',
      description: 'Makes the ball partially invisible',
      duration: 5000, // 5 seconds
      color: '#9B59B6', // Purple
      target: PowerUpTarget.BALL,
      probability: 10,
    },
    [PowerUpType.SHRINK_OPPONENT]: {
      type: PowerUpType.SHRINK_OPPONENT,
      name: 'Shrink Opponent',
      description: 'Reduces computer paddle size',
      duration: 8000, // 8 seconds
      color: '#F1C40F', // Yellow
      target: PowerUpTarget.COMPUTER,
      probability: 15,
    },
  },
  
  // Configuration
  spawnInterval: 8000, // Spawn a new power-up every 8 seconds
  maxPowerUps: 2, // Maximum of 2 power-ups on screen at once
  isPowerUpSpawningEnabled: true, // Power-up spawning enabled by default
  
  /**
   * Spawn a power-up on the canvas if conditions are met
   * 
   * This function is called periodically during gameplay to create new power-ups.
   * It uses a weighted probability system to determine which type of power-up to spawn,
   * and carefully positions them to avoid interfering with gameplay.
   * 
   * @param canvasWidth Width of the game canvas
   * @param canvasHeight Height of the game canvas
   */
  spawnPowerUp: (canvasWidth, canvasHeight) => {
    const state = get();
    
    // Early exit conditions: don't spawn if disabled or at maximum capacity
    if (!state.isPowerUpSpawningEnabled || state.spawnedPowerUps.length >= state.maxPowerUps) {
      return;
    }
    
    const now = Date.now();
    
    // Check if enough time has passed since the last spawn
    if (now >= state.nextSpawnTime) {
      // Step 1: Select a power-up type using weighted probability
      const powerUpTypes = Object.values(state.powerUpConfigs);
      const probabilitySum = powerUpTypes.reduce((sum, config) => sum + config.probability, 0);
      let randomValue = Math.random() * probabilitySum;
      
      // Use a roulette wheel selection algorithm
      let selectedType: PowerUpType | null = null;
      for (const config of powerUpTypes) {
        randomValue -= config.probability;
        if (randomValue <= 0) {
          selectedType = config.type;
          break;
        }
      }
      
      if (selectedType) {
        const config = state.powerUpConfigs[selectedType];
        
        // Step 2: Calculate safe positioning for the power-up
        // Avoid edges (where paddles are) and center (where ball starts)
        const margin = 50; // Distance from canvas edges
        const centerMargin = 100; // Distance from center where ball spawns
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Generate random positions until we find a good spot
        let x, y;
        do {
          x = margin + Math.random() * (canvasWidth - 2 * margin);
          y = margin + Math.random() * (canvasHeight - 2 * margin);
        } while (
          // Avoid spawning too close to the center where ball movements are frequent
          Math.abs(x - centerX) < centerMargin && 
          Math.abs(y - centerY) < centerMargin
        );
        
        // Step 3: Create the power-up object with unique ID and visual properties
        const newPowerUp: SpawnedPowerUp = {
          id: `power-up-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: selectedType,
          x,
          y,
          radius: 15, // Standard size for all power-ups (consistent visual)
          color: config.color, // Each power-up type has its own color
        };
        
        // Step 4: Add to game state and schedule next spawn
        set((state) => ({
          spawnedPowerUps: [...state.spawnedPowerUps, newPowerUp],
          nextSpawnTime: now + state.spawnInterval, // Reset spawn timer
        }));
      }
    }
  },
  
  /**
   * Collect a power-up by its ID and activate its effect
   * 
   * This function handles the core logic of power-up collection and effect assignment.
   * The key feature is that power-ups are assigned based on who collects them:
   * - If the player collects a power-up, they get the intended effect
   * - If the computer collects a power-up, the effects are reversed:
   *   * Beneficial effects go to the computer instead
   *   * Detrimental effects are applied to the player instead
   * 
   * @param id The unique ID of the power-up to collect
   * @param isPlayerCollecting Whether the player is collecting (true) or computer (false)
   * @returns The type of the collected power-up, or null if not found
   */
  collectPowerUp: (id, isPlayerCollecting = true) => {
    const { spawnedPowerUps, powerUpConfigs, activePowerUps } = get();
    
    // Step 1: Find the power-up by its unique ID
    const powerUpIndex = spawnedPowerUps.findIndex((p) => p.id === id);
    if (powerUpIndex === -1) return null; // Power-up not found
    
    const collectedPowerUp = spawnedPowerUps[powerUpIndex];
    const config = powerUpConfigs[collectedPowerUp.type];
    
    // Step 2: Remove the power-up from the game field (it's been collected)
    set((state) => ({
      spawnedPowerUps: state.spawnedPowerUps.filter((p) => p.id !== id),
    }));
    
    // Step 3: Determine who should receive the power-up effect
    let effectiveTarget = config.target;
    let effectiveType = collectedPowerUp.type;
    
    // Handle power-up effect assignment based on who collected it
    if (!isPlayerCollecting) {
      // Computer collected the power-up - reverse the intended effects
      if (effectiveTarget === PowerUpTarget.PLAYER) {
        // Original: Power-up was meant to help the player
        // New: Since computer collected it, computer gets the benefit instead
        effectiveTarget = PowerUpTarget.COMPUTER;
      } else if (effectiveTarget === PowerUpTarget.COMPUTER) {
        // Original: Power-up was meant to hurt the computer (like shrink opponent)
        // New: Since computer collected it, the player gets hurt instead
        effectiveTarget = PowerUpTarget.PLAYER;
      }
      // Note: For BALL and GAME targets, effects stay the same since they affect the game globally
    } else {
      // Player collected the power-up - effects work as originally intended
      // No target changes needed - player gets benefits, computer gets detriments
    }
    
    // Step 4: Create and activate the power-up effect
    const now = Date.now();
    const newActivePowerUp: ActivePowerUp = {
      type: collectedPowerUp.type,
      endTime: now + config.duration, // Calculate when this effect expires
      target: effectiveTarget, // Who the effect applies to
    };
    
    // Step 5: Replace any existing power-up of the same type and target
    // This prevents stacking the same effect multiple times
    const filteredActivePowerUps = activePowerUps.filter(
      (p) => !(p.type === newActivePowerUp.type && p.target === newActivePowerUp.target)
    );
    
    // Step 6: Add the new power-up to the active effects list
    set({
      activePowerUps: [...filteredActivePowerUps, newActivePowerUp],
    });
    
    return collectedPowerUp.type;
  },
  
  /**
   * Check for and remove any expired power-ups
   */
  checkExpiredPowerUps: () => {
    const { activePowerUps } = get();
    const now = Date.now();
    
    const updatedActivePowerUps = activePowerUps.filter((p) => p.endTime > now);
    
    if (updatedActivePowerUps.length !== activePowerUps.length) {
      set({ activePowerUps: updatedActivePowerUps });
    }
  },
  
  /**
   * Check if a specific power-up type is currently active for a target
   * @param type The power-up type to check
   * @param target The target to check
   * @returns True if the power-up is active, false otherwise
   */
  isActive: (type, target) => {
    const { activePowerUps } = get();
    const now = Date.now();
    
    return activePowerUps.some(
      (p) => p.type === type && p.target === target && p.endTime > now
    );
  },
  
  /**
   * Calculate the current ball speed multiplier based on active power-ups
   * 
   * This function combines multiple ball-affecting power-ups to determine
   * the final speed modifier. Effects can stack (multiply together).
   * 
   * @returns Multiplier for ball speed (> 1 for faster, < 1 for slower, 1 for normal)
   */
  getBallSpeedMultiplier: () => {
    const state = get();
    let multiplier = 1; // Start with normal speed
    
    // Apply speed boost effect (makes ball faster)
    if (state.isActive(PowerUpType.SPEED_BOOST, PowerUpTarget.BALL)) {
      multiplier *= 1.6; // 60% speed increase - ball becomes harder to track
    }
    
    // Apply slow motion effect (makes ball slower)
    if (state.isActive(PowerUpType.SLOW_MOTION, PowerUpTarget.BALL)) {
      multiplier *= 0.6; // 40% speed decrease - ball becomes easier to hit
    }
    
    // Note: If both effects are active, they multiply (1.6 * 0.6 = 0.96, slightly slower than normal)
    return multiplier;
  },
  
  /**
   * Calculate the current player paddle height multiplier based on active power-ups
   * 
   * This determines how large or small the player's paddle should be.
   * Multiple effects can apply simultaneously and will multiply together.
   * 
   * @returns Multiplier for paddle height (> 1 for larger, < 1 for smaller, 1 for normal)
   */
  getPlayerPaddleHeightMultiplier: () => {
    const state = get();
    let multiplier = 1; // Start with normal paddle size
    
    // Beneficial effect: Player collected a paddle extender power-up
    if (state.isActive(PowerUpType.PADDLE_EXTENDER, PowerUpTarget.PLAYER)) {
      multiplier *= 1.5; // 50% larger paddle - easier to hit the ball
    }
    
    // Detrimental effect: Computer collected a "shrink opponent" power-up, affecting the player
    if (state.isActive(PowerUpType.SHRINK_OPPONENT, PowerUpTarget.PLAYER)) {
      multiplier *= 0.6; // 40% smaller paddle - harder to hit the ball
    }
    
    return multiplier;
  },
  
  /**
   * Get the current computer paddle height multiplier based on active power-ups
   * @returns Multiplier for paddle height (> 1 for larger, < 1 for smaller)
   */
  getComputerPaddleHeightMultiplier: () => {
    const state = get();
    let multiplier = 1;
    
    // Computer gets benefit from PADDLE_EXTENDER targeted at them (when computer collected it)
    if (state.isActive(PowerUpType.PADDLE_EXTENDER, PowerUpTarget.COMPUTER)) {
      multiplier *= 1.5; // 50% larger paddle
    }
    
    // Computer gets debuff from SHRINK_OPPONENT targeted at them (when player collected it)
    if (state.isActive(PowerUpType.SHRINK_OPPONENT, PowerUpTarget.COMPUTER)) {
      multiplier *= 0.6; // 40% smaller paddle
    }
    
    return multiplier;
  },
  
  /**
   * Get the current ball opacity based on active power-ups
   * @returns Opacity value (0-1)
   */
  getBallOpacity: () => {
    const state = get();
    
    if (state.isActive(PowerUpType.INVISIBILITY, PowerUpTarget.BALL)) {
      return 0.3; // 30% opacity when invisible
    }
    
    return 1; // 100% opacity by default
  },
  
  /**
   * Enable the power-up system
   */
  enablePowerUps: () => set({ isPowerUpSpawningEnabled: true }),
  
  /**
   * Disable the power-up system
   */
  disablePowerUps: () => set({ 
    isPowerUpSpawningEnabled: false, 
    spawnedPowerUps: [],
    activePowerUps: [],
  }),
}));