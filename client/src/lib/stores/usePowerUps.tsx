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
   * @param canvasWidth Width of the game canvas
   * @param canvasHeight Height of the game canvas
   */
  spawnPowerUp: (canvasWidth, canvasHeight) => {
    const state = get();
    
    // Don't spawn if disabled or max power-ups reached
    if (!state.isPowerUpSpawningEnabled || state.spawnedPowerUps.length >= state.maxPowerUps) {
      return;
    }
    
    const now = Date.now();
    
    // Check if it's time to spawn a new power-up
    if (now >= state.nextSpawnTime) {
      // Get list of possible power-ups based on probability
      const powerUpTypes = Object.values(state.powerUpConfigs);
      const probabilitySum = powerUpTypes.reduce((sum, config) => sum + config.probability, 0);
      let randomValue = Math.random() * probabilitySum;
      
      // Select a power-up type based on probability
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
        
        // Calculate a position in the play area
        // Keep away from the edges and center (where ball starts)
        const margin = 50;
        const centerMargin = 100;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Generate random positions until we get one that's not too close to the center
        let x, y;
        do {
          x = margin + Math.random() * (canvasWidth - 2 * margin);
          y = margin + Math.random() * (canvasHeight - 2 * margin);
        } while (
          Math.abs(x - centerX) < centerMargin && 
          Math.abs(y - centerY) < centerMargin
        );
        
        // Create a new power-up
        const newPowerUp: SpawnedPowerUp = {
          id: `power-up-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: selectedType,
          x,
          y,
          radius: 15, // Fixed size for all power-ups
          color: config.color,
        };
        
        set((state) => ({
          spawnedPowerUps: [...state.spawnedPowerUps, newPowerUp],
          nextSpawnTime: now + state.spawnInterval,
        }));
      }
    }
  },
  
  /**
   * Collect a power-up by its ID and activate its effect
   * @param id The ID of the power-up to collect
   * @param isPlayerCollecting Whether the player is collecting the power-up (true) or the computer (false)
   * @returns The type of the collected power-up, or null if not found
   */
  collectPowerUp: (id, isPlayerCollecting = true) => {
    const { spawnedPowerUps, powerUpConfigs, activePowerUps } = get();
    
    // Find the power-up by ID
    const powerUpIndex = spawnedPowerUps.findIndex((p) => p.id === id);
    if (powerUpIndex === -1) return null;
    
    const collectedPowerUp = spawnedPowerUps[powerUpIndex];
    const config = powerUpConfigs[collectedPowerUp.type];
    
    // Remove from spawned power-ups
    set((state) => ({
      spawnedPowerUps: state.spawnedPowerUps.filter((p) => p.id !== id),
    }));
    
    // Determine the correct target based on who collected the power-up
    let effectiveTarget = config.target;
    let effectiveType = collectedPowerUp.type;
    
    // Handle power-up effects based on collector
    if (!isPlayerCollecting) {
      // Computer collected the power-up
      if (effectiveTarget === PowerUpTarget.PLAYER) {
        // Power-up meant to help player - computer gets it instead
        effectiveTarget = PowerUpTarget.COMPUTER;
      } else if (effectiveTarget === PowerUpTarget.COMPUTER) {
        // Power-up meant to hurt computer - now hurts player instead
        effectiveTarget = PowerUpTarget.PLAYER;
      }
      // For BALL and GAME targets, the effect stays the same but may benefit computer more
    } else {
      // Player collected the power-up - effects work as intended
      // No changes needed for player collection
    }
    
    // Add to active power-ups
    const now = Date.now();
    const newActivePowerUp: ActivePowerUp = {
      type: collectedPowerUp.type,
      endTime: now + config.duration,
      target: effectiveTarget,
    };
    
    // Replace any existing power-up of the same type
    const filteredActivePowerUps = activePowerUps.filter(
      (p) => !(p.type === newActivePowerUp.type && p.target === newActivePowerUp.target)
    );
    
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
   * Get the current ball speed multiplier based on active power-ups
   * @returns Multiplier for ball speed (> 1 for faster, < 1 for slower)
   */
  getBallSpeedMultiplier: () => {
    const state = get();
    let multiplier = 1;
    
    if (state.isActive(PowerUpType.SPEED_BOOST, PowerUpTarget.BALL)) {
      multiplier *= 1.6; // 60% speed increase
    }
    
    if (state.isActive(PowerUpType.SLOW_MOTION, PowerUpTarget.BALL)) {
      multiplier *= 0.6; // 40% speed decrease
    }
    
    return multiplier;
  },
  
  /**
   * Get the current player paddle height multiplier based on active power-ups
   * @returns Multiplier for paddle height (> 1 for larger, < 1 for smaller)
   */
  getPlayerPaddleHeightMultiplier: () => {
    const state = get();
    let multiplier = 1;
    
    // Player gets benefit from PADDLE_EXTENDER targeted at them
    if (state.isActive(PowerUpType.PADDLE_EXTENDER, PowerUpTarget.PLAYER)) {
      multiplier *= 1.5; // 50% larger paddle
    }
    
    // Player gets debuff from SHRINK_OPPONENT targeted at them (when computer collected it)
    if (state.isActive(PowerUpType.SHRINK_OPPONENT, PowerUpTarget.PLAYER)) {
      multiplier *= 0.6; // 40% smaller paddle
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