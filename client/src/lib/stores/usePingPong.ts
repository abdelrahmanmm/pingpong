import { create } from "zustand";
import { useAudio } from "./useAudio";
import { usePowerUps } from "./usePowerUps";

/**
 * Represents who won the game, if anyone
 * null means the game is still in progress
 */
type GameWinner = "player" | "computer" | null;

/**
 * Difficulty level of the game
 * Each level increases computer paddle speed and prediction accuracy
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Represents a single ball in the game
 * Used for both the main ball and additional balls from multiball power-up
 */
interface Ball {
  id: string;                  // Unique identifier for the ball
  x: number;                   // X-position of ball center
  y: number;                   // Y-position of ball center
  speedX: number;              // Horizontal speed of ball (pixels per frame)
  speedY: number;              // Vertical speed of ball (pixels per frame)
  isMainBall: boolean;         // True if this is the primary ball (affects scoring)
}

/**
 * Main state interface for the ping pong game
 * Contains all game state, settings, and methods needed to control the game
 */
interface PingPongState {
  // Game dimensions
  canvasWidth: number;         // Width of the game canvas
  canvasHeight: number;        // Height of the game canvas
  paddleWidth: number;         // Width of both paddles
  paddleHeight: number;        // Height of both paddles
  ballSize: number;            // Diameter of the ball

  // Game positions
  playerPaddleY: number;       // Y-position of player paddle (left side)
  computerPaddleY: number;     // Y-position of computer paddle (right side)
  
  // Ball system - supports multiple balls for multiball power-up
  balls: Ball[];               // Array of all active balls in the game
  
  // Legacy ball properties (kept for backward compatibility)
  ballX: number;               // X-position of main ball center
  ballY: number;               // Y-position of main ball center
  ballSpeedX: number;          // Horizontal speed of main ball (pixels per frame)
  ballSpeedY: number;          // Vertical speed of main ball (pixels per frame)

  // Game state
  playerScore: number;         // Current score of the player
  computerScore: number;       // Current score of the computer
  isGameStarted: boolean;      // Whether the game has been started
  isGameOver: boolean;         // Whether the game has ended
  isPaused: boolean;           // Whether the game is currently paused
  winner: GameWinner;          // Who won the game, if it's over
  frameCount: number;          // Counter used for timing certain actions
  lastRandomOffset: number | null; // Last random offset used for computer paddle (smoother movement)
  
  // Game settings
  pointsToWin: number;         // Points needed to win the game
  initialBallSpeed: number;    // Starting speed of the ball
  ballSpeedIncrement: number;  // How much to increase ball speed after each point
  
  // Difficulty settings
  currentLevel: DifficultyLevel;      // Current difficulty level (1-5)
  maxLevel: DifficultyLevel;          // Maximum level in the game
  computerBaseSpeed: number;          // Base speed of computer paddle
  computerSpeedMultiplier: number;    // Speed multiplier based on level
  predictionAccuracy: number;         // How accurately computer predicts ball trajectory (0-1)
  
  // Methods
  initialize: () => void;                      // Initialize or reset game dimensions
  updatePlayerPaddle: (y: number) => void;     // Move the player paddle
  updateGame: () => void;                      // Update game state for next frame
  startGame: () => void;                       // Start a new game
  restartGame: () => void;                     // Restart the game after it ends
  resetBall: () => void;                       // Reset ball to center with initial speed
  togglePause: () => void;                     // Pause or resume the game
  scorePoint: (player: "player" | "computer") => void; // Add point to player/computer
  levelUp: () => void;                         // Increase the difficulty level
  setDifficultyLevel: (level: DifficultyLevel) => void; // Manually set the difficulty level
  getComputerPaddleSpeed: () => number;        // Calculate current computer paddle speed
  getDifficultyName: () => string;             // Get the name of the current difficulty level
  getAllDifficultyLevels: () => {level: DifficultyLevel, name: string}[]; // Get all available difficulty levels
  
  // Multiball system methods
  createMainBall: () => Ball;                  // Create the primary ball
  addExtraBalls: (count: number) => void;      // Add extra balls for multiball power-up
  removeExtraBalls: () => void;                // Remove all extra balls, keeping only main ball
  getMainBall: () => Ball | undefined;         // Get the main ball from the balls array
  updateBallPositions: (ball: Ball, ballSpeedMultiplier: number) => Ball; // Update a single ball's position
}

export const usePingPong = create<PingPongState>((set, get) => {
  // Game loop reference
  let gameLoopRef: number | null = null;

  // Game loop function
  const gameLoop = () => {
    const state = get();
    if (state.isGameStarted && !state.isGameOver && !state.isPaused) {
      state.updateGame();
    }
    gameLoopRef = requestAnimationFrame(gameLoop);
  };

  return {
    // Default dimensions - will be adjusted on initialization
    canvasWidth: 800,
    canvasHeight: 600,
    paddleWidth: 15,
    paddleHeight: 100,
    ballSize: 15,

    // Default positions
    playerPaddleY: 300,
    computerPaddleY: 300,
    ballX: 400,
    ballY: 300,
    ballSpeedX: 5,
    ballSpeedY: 0,
    
    // Initialize with one main ball for multiball system
    balls: [],

    // Game state
    playerScore: 0,
    computerScore: 0,
    isGameStarted: false,
    isGameOver: false,
    isPaused: false,
    winner: null,
    frameCount: 0,
    lastRandomOffset: null,
    
    // Game settings
    pointsToWin: 5,
    initialBallSpeed: 5,
    ballSpeedIncrement: 0.2,
    
    // Difficulty settings
    currentLevel: 1 as DifficultyLevel,
    maxLevel: 5 as DifficultyLevel,
    computerBaseSpeed: 3, // Reduced from 4 to make beginner more manageable
    computerSpeedMultiplier: 1,
    predictionAccuracy: 0.5,

    // Initialize game dimensions based on screen size
    initialize: () => {
      set((state) => {
        // Determine canvas size based on screen width
        const isMobile = window.innerWidth < 768;
        const canvasWidth = isMobile ? 400 : 800;
        const canvasHeight = isMobile ? 300 : 600;
        
        // Scale paddle and ball size proportionally
        const scaleFactor = canvasWidth / 800;
        const paddleWidth = Math.max(10, Math.round(15 * scaleFactor));
        const paddleHeight = Math.max(60, Math.round(100 * scaleFactor));
        const ballSize = Math.max(10, Math.round(15 * scaleFactor));
        
        // Position the ball and paddles
        const playerPaddleY = canvasHeight / 2;
        const computerPaddleY = canvasHeight / 2;
        const ballX = canvasWidth / 2;
        const ballY = canvasHeight / 2;
        
        // Initialize ball speed
        const initialBallSpeed = isMobile ? 4 : 5;
        
        // Start game loop if not already running
        if (gameLoopRef === null) {
          gameLoopRef = requestAnimationFrame(gameLoop);
        }
        
        return {
          canvasWidth,
          canvasHeight,
          paddleWidth,
          paddleHeight,
          ballSize,
          playerPaddleY,
          computerPaddleY,
          ballX,
          ballY,
          initialBallSpeed,
          ballSpeedX: initialBallSpeed,
        };
      });
    },

    // Update player paddle position
    updatePlayerPaddle: (y) => {
      set((state) => {
        // Constrain paddle within canvas boundaries
        const halfPaddleHeight = state.paddleHeight / 2;
        const newY = Math.max(
          halfPaddleHeight,
          Math.min(state.canvasHeight - halfPaddleHeight, y)
        );
        return { playerPaddleY: newY };
      });
    },

    // Update game state (ball position, computer paddle, collision detection)
    updateGame: () => {
      // Declare scoring variables outside the set function
      let shouldScore = false;
      let scoringPlayer = "";
      
      set((state) => {
        const audio = useAudio.getState();
        const powerUps = usePowerUps.getState();
        
        // Check for multiball power-up activation
        // If multiball is active and we don't have extra balls, add them
        if (powerUps.isActive(usePowerUps.getState().powerUpConfigs.MULTI_BALL.type, usePowerUps.getState().powerUpConfigs.MULTI_BALL.target)) {
          if (state.balls.length <= 1) {
            // Add 2 extra balls for multiball effect
            state.addExtraBalls(2);
          }
        } else {
          // Multiball not active, remove extra balls if any exist
          if (state.balls.length > 1) {
            state.removeExtraBalls();
          }
        }
        
        // Ensure we have at least the main ball
        if (state.balls.length === 0) {
          state.balls.push(state.createMainBall());
        }
        
        // Apply power-up effects to ball speed
        const ballSpeedMultiplier = powerUps.getBallSpeedMultiplier();
        
        // Update all balls using the new multiball system
        let updatedBalls = state.balls.map(ball => 
          state.updateBallPositions(ball, ballSpeedMultiplier)
        );
        
        // Update legacy ball properties from main ball for backward compatibility
        const mainBall = updatedBalls.find(ball => ball.isMainBall);
        let newBallX = state.ballX;
        let newBallY = state.ballY;
        let newBallSpeedX = state.ballSpeedX;
        let newBallSpeedY = state.ballSpeedY;
        
        if (mainBall) {
          newBallX = mainBall.x;
          newBallY = mainBall.y;
          newBallSpeedX = mainBall.speedX;
          newBallSpeedY = mainBall.speedY;
        }
        
        // Computer AI - move towards the main ball with prediction based on difficulty level
        // Only the main ball affects AI behavior to keep it manageable
        let computerPaddleTarget = state.computerPaddleY;
        
        // Only move computer paddle when ball is moving toward it
        if (state.ballSpeedX > 0) {
          // Use the prediction accuracy based on current difficulty level
          const currentAccuracy = state.predictionAccuracy;
          
          // Add prediction based on ball trajectory (more accurate at higher levels)
          const predictedY = newBallY + (newBallSpeedY * 
            ((state.canvasWidth - newBallX) / newBallSpeedX) * currentAccuracy);
          
          // Add some randomness at lower difficulty levels
          // Higher randomness for beginner level to make it more forgiving
          const randomFactor = state.currentLevel === 1 
            ? 30 // Much more randomness for beginner
            : Math.max(0, (1 - currentAccuracy) * 20);
          
          // Apply random offset that's updated only occasionally for smoother movement
          // This helps reduce the paddle jittering when following the ball
          if (state.frameCount % 30 === 0 || !state.lastRandomOffset) {
            state.lastRandomOffset = randomFactor > 0 
              ? (Math.random() * randomFactor - randomFactor/2) 
              : 0;
          }
          const randomOffset = state.lastRandomOffset;
          
          // Clamp the prediction to canvas bounds
          computerPaddleTarget = Math.max(
            state.paddleHeight / 2,
            Math.min(state.canvasHeight - state.paddleHeight / 2, predictedY + randomOffset)
          );
        }
        
        // Calculate the computer paddle speed based on current level
        const computerPaddleSpeed = state.computerBaseSpeed * state.computerSpeedMultiplier;
        let newComputerPaddleY = state.computerPaddleY;
        
        // Move computer paddle toward target with current speed
        // Only move if the distance is significant (add a small deadzone to prevent jitter)
        const distanceToTarget = Math.abs(computerPaddleTarget - state.computerPaddleY);
        const deadzone = 2; // Pixels of deadzone to prevent small jittery movements
        
        if (distanceToTarget > deadzone) {
          if (computerPaddleTarget > state.computerPaddleY) {
            newComputerPaddleY = Math.min(
              computerPaddleTarget, 
              state.computerPaddleY + computerPaddleSpeed
            );
          } else if (computerPaddleTarget < state.computerPaddleY) {
            newComputerPaddleY = Math.max(
              computerPaddleTarget, 
              state.computerPaddleY - computerPaddleSpeed
            );
          }
        } else {
          // Within deadzone - hold position to prevent jitter
          newComputerPaddleY = state.computerPaddleY;
        }
        
        // Remove any balls that have gone off the screen and handle scoring
        // Only the main ball affects scoring - extra balls just disappear
        let ballsToRemove = [];
        
        for (let i = 0; i < updatedBalls.length; i++) {
          const ball = updatedBalls[i];
          
          // Check if ball has gone past the paddles
          if (ball.x - state.ballSize / 2 <= 0) {
            // Ball went past player paddle - computer scores
            if (ball.isMainBall && state.isGameStarted && !state.isGameOver && !state.isPaused) {
              shouldScore = true;
              scoringPlayer = "computer";
              console.log("Computer scored a point (main ball)");
            }
            ballsToRemove.push(i);
          } else if (ball.x + state.ballSize / 2 >= state.canvasWidth) {
            // Ball went past computer paddle - player scores
            if (ball.isMainBall && state.isGameStarted && !state.isGameOver && !state.isPaused) {
              shouldScore = true;
              scoringPlayer = "player";
              console.log("Player scored a point (main ball)");
            }
            ballsToRemove.push(i);
          }
        }
        
        // Remove balls that went off screen (reverse order to maintain indices)
        for (let i = ballsToRemove.length - 1; i >= 0; i--) {
          updatedBalls.splice(ballsToRemove[i], 1);
        }
        
        // Update state with new ball positions and computer paddle
        return {
          balls: updatedBalls,
          ballX: newBallX,
          ballY: newBallY,
          ballSpeedX: newBallSpeedX,
          ballSpeedY: newBallSpeedY,
          computerPaddleY: newComputerPaddleY,
          frameCount: state.frameCount + 1, // Increment frame counter for timing events
        };
      });
      
      // Handle scoring after updating positions
      if (shouldScore && scoringPlayer) {
        get().scorePoint(scoringPlayer as "player" | "computer");
      }
    },

    // Start the game
    startGame: () => {
      set((state) => {
        if (state.isGameOver) {
          return { isGameStarted: true, isGameOver: false };
        }
        return { isGameStarted: true };
      });
      // Enable power-ups when game starts
      usePowerUps.getState().enablePowerUps();
      get().resetBall();
    },

    // Restart the game
    restartGame: () => {
      set({
        playerScore: 0,
        computerScore: 0,
        isGameStarted: true,
        isGameOver: false,
        isPaused: false,
        winner: null,
        currentLevel: 1 as DifficultyLevel,
        computerSpeedMultiplier: 1,
        predictionAccuracy: 0.5,
        frameCount: 0,
        lastRandomOffset: null,
      });
      // Reset and enable power-ups when restarting
      usePowerUps.getState().disablePowerUps();
      usePowerUps.getState().enablePowerUps();
      get().resetBall();
    },

    // Reset ball to center with random direction and initialize multiball system
    resetBall: () => {
      set((state) => {
        // Randomize initial ball direction but ensure it moves horizontally
        const direction = Math.random() > 0.5 ? 1 : -1;
        const angle = (Math.random() * Math.PI / 4) - Math.PI / 8; // -22.5 to 22.5 degrees
        
        const newBallX = state.canvasWidth / 2;
        const newBallY = state.canvasHeight / 2;
        const newBallSpeedX = state.initialBallSpeed * direction * Math.cos(angle);
        const newBallSpeedY = state.initialBallSpeed * Math.sin(angle);
        
        // Create the main ball for the multiball system
        const mainBall: Ball = {
          id: 'main-ball',
          x: newBallX,
          y: newBallY,
          speedX: newBallSpeedX,
          speedY: newBallSpeedY,
          isMainBall: true,
        };
        
        // Initialize with only the main ball (remove any extra balls from previous rounds)
        return {
          ballX: newBallX,
          ballY: newBallY,
          ballSpeedX: newBallSpeedX,
          ballSpeedY: newBallSpeedY,
          balls: [mainBall], // Reset to single ball
        };
      });
    },

    // Toggle pause state
    togglePause: () => {
      set((state) => ({ isPaused: !state.isPaused }));
    },

    // Score a point for the specified player
    scorePoint: (player) => {
      set((state) => {
        const audio = useAudio.getState();
        const powerUps = usePowerUps.getState();
        audio.playSuccess();
        
        let playerScore = state.playerScore;
        let computerScore = state.computerScore;
        let isGameOver = state.isGameOver;
        let winner = state.winner;
        
        // Immediately pause the ball by placing it in the center
        // This prevents multiple scoring events while we wait for the reset
        const ballX = state.canvasWidth / 2;
        const ballY = state.canvasHeight / 2;
        const ballSpeedX = 0; // Temporarily stop the ball
        const ballSpeedY = 0;
        
        if (player === "player") {
          playerScore += 1;
          console.log(`Player score is now: ${playerScore}`);
          
          // Player just scored - check if we should level up the game
          if (playerScore > 0 && playerScore % 3 === 0) {
            // Level up every 3 player points
            get().levelUp();
          }
          
          if (playerScore >= state.pointsToWin) {
            isGameOver = true;
            winner = "player";
            // Disable power-ups when game ends
            powerUps.disablePowerUps();
          }
        } else {
          computerScore += 1;
          console.log(`Computer score is now: ${computerScore}`);
          if (computerScore >= state.pointsToWin) {
            isGameOver = true;
            winner = "computer";
            // Disable power-ups when game ends
            powerUps.disablePowerUps();
          }
        }
        
        // If game continues, reset ball after a short delay
        if (!isGameOver) {
          // Use a slight delay to create a visual pause between points
          setTimeout(() => get().resetBall(), 1000);
        }
        
        return {
          playerScore,
          computerScore,
          isGameOver,
          winner,
          ballX,
          ballY,
          ballSpeedX,
          ballSpeedY
        };
      });
    },
    
    // Increase the difficulty level
    levelUp: () => {
      set((state) => {
        // Don't go beyond max level
        if (state.currentLevel >= state.maxLevel) {
          return {};
        }
        
        // Increment level
        const newLevel = (state.currentLevel + 1) as DifficultyLevel;
        
        // Increase computer speed and prediction accuracy
        const newSpeedMultiplier = state.computerSpeedMultiplier + 0.25;
        const newPredictionAccuracy = Math.min(0.95, state.predictionAccuracy + 0.1);
        
        console.log(`Level up! Now at level ${newLevel}`);
        
        return {
          currentLevel: newLevel,
          computerSpeedMultiplier: newSpeedMultiplier,
          predictionAccuracy: newPredictionAccuracy
        };
      });
    },
    
    // Get current computer paddle speed based on level
    getComputerPaddleSpeed: () => {
      const state = get();
      return state.computerBaseSpeed * state.computerSpeedMultiplier;
    },
    
    // Get the name of the current difficulty level
    getDifficultyName: () => {
      const level = get().currentLevel;
      const difficultyNames = {
        1: "Beginner",
        2: "Easy",
        3: "Medium", 
        4: "Hard",
        5: "Expert"
      };
      return difficultyNames[level] || "Unknown";
    },
    
    // Manually set the difficulty level
    setDifficultyLevel: (level: DifficultyLevel) => {
      set((state) => {
        console.log(`Manually setting difficulty to level ${level}`);
        
        // Define settings for each difficulty level
        const difficultySettings = {
          1: { speedMultiplier: 1.0, predictionAccuracy: 0.5 },   // Beginner
          2: { speedMultiplier: 1.25, predictionAccuracy: 0.6 },  // Easy
          3: { speedMultiplier: 1.5, predictionAccuracy: 0.7 },   // Medium
          4: { speedMultiplier: 1.75, predictionAccuracy: 0.85 }, // Hard
          5: { speedMultiplier: 2.0, predictionAccuracy: 0.95 },  // Expert
        };
        
        // Get settings for the selected level
        const settings = difficultySettings[level] || difficultySettings[1];
        
        return {
          currentLevel: level,
          computerSpeedMultiplier: settings.speedMultiplier,
          predictionAccuracy: settings.predictionAccuracy
        };
      });
    },
    
    // Get all available difficulty levels for selection UI
    getAllDifficultyLevels: () => {
      return [
        { level: 1 as DifficultyLevel, name: "Beginner" },
        { level: 2 as DifficultyLevel, name: "Easy" },
        { level: 3 as DifficultyLevel, name: "Medium" },
        { level: 4 as DifficultyLevel, name: "Hard" },
        { level: 5 as DifficultyLevel, name: "Expert" }
      ];
    },

    // MULTIBALL SYSTEM IMPLEMENTATION
    // These methods handle the creation and management of multiple balls

    /**
     * Create the main ball object
     * This is the primary ball that determines scoring and game flow
     */
    createMainBall: (): Ball => {
      const state = get();
      return {
        id: 'main-ball',
        x: state.ballX,
        y: state.ballY,
        speedX: state.ballSpeedX,
        speedY: state.ballSpeedY,
        isMainBall: true,
      };
    },

    /**
     * Add extra balls for multiball power-up effect
     * Creates additional balls with randomized positions and speeds
     * @param count Number of additional balls to spawn
     */
    addExtraBalls: (count) => {
      set((state) => {
        const newBalls = [...state.balls];
        
        // Ensure we have the main ball
        const mainBall = newBalls.find(ball => ball.isMainBall);
        if (!mainBall) {
          newBalls.push(state.createMainBall());
        }
        
        // Add extra balls with varied trajectories
        for (let i = 0; i < count; i++) {
          const extraBall: Ball = {
            id: `extra-ball-${Date.now()}-${i}`,
            x: state.canvasWidth / 2, // Start from center
            y: state.canvasHeight / 2,
            // Create varied speeds and directions for interesting gameplay
            speedX: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 4), // Random speed 3-7
            speedY: (Math.random() - 0.5) * 6, // Random vertical direction
            isMainBall: false, // Extra balls don't affect scoring
          };
          newBalls.push(extraBall);
        }
        
        console.log(`Added ${count} extra balls for multiball effect`);
        return { balls: newBalls };
      });
    },

    /**
     * Remove all extra balls, keeping only the main ball
     * Called when multiball power-up expires
     */
    removeExtraBalls: () => {
      set((state) => {
        // Keep only the main ball
        const mainBall = state.balls.find(ball => ball.isMainBall);
        const newBalls = mainBall ? [mainBall] : [state.createMainBall()];
        
        console.log('Multiball effect ended - removed extra balls');
        return { balls: newBalls };
      });
    },

    /**
     * Get the main ball from the balls array
     * @returns The main ball, or undefined if not found
     */
    getMainBall: () => {
      const state = get();
      return state.balls.find(ball => ball.isMainBall);
    },

    /**
     * Update position and handle collisions for a single ball
     * This method contains the core ball physics and collision logic
     * @param ball The ball to update
     * @param ballSpeedMultiplier Speed modifier from power-ups
     * @returns Updated ball object
     */
    updateBallPositions: (ball, ballSpeedMultiplier) => {
      const state = get();
      const audio = useAudio.getState();
      
      // Apply power-up speed effects to ball movement
      let newX = ball.x + (ball.speedX * ballSpeedMultiplier);
      let newY = ball.y + (ball.speedY * ballSpeedMultiplier);
      let newSpeedX = ball.speedX;
      let newSpeedY = ball.speedY;
      
      // Ball collision with top and bottom walls
      if (newY - state.ballSize / 2 <= 0 || newY + state.ballSize / 2 >= state.canvasHeight) {
        newSpeedY = -newSpeedY; // Reverse vertical direction
        // Play hit sound only for main ball to avoid audio spam
        if (ball.isMainBall) {
          audio.playHit();
        }
      }
      
      // Get paddle height multipliers from power-ups
      const powerUps = usePowerUps.getState();
      const playerPaddleMultiplier = powerUps.getPlayerPaddleHeightMultiplier();
      const computerPaddleMultiplier = powerUps.getComputerPaddleHeightMultiplier();
      
      // Calculate effective paddle heights with power-up effects
      const effectivePlayerPaddleHeight = state.paddleHeight * playerPaddleMultiplier;
      const effectiveComputerPaddleHeight = state.paddleHeight * computerPaddleMultiplier;
      
      // Ball collision with player paddle (left side)
      if (newX - state.ballSize / 2 <= state.paddleWidth && 
          newY >= state.playerPaddleY - effectivePlayerPaddleHeight / 2 && 
          newY <= state.playerPaddleY + effectivePlayerPaddleHeight / 2) {
        
        // Calculate bounce angle based on hit position on paddle
        const relativeIntersectY = state.playerPaddleY - newY;
        const normalizedIntersection = relativeIntersectY / (effectivePlayerPaddleHeight / 2);
        const bounceAngle = normalizedIntersection * Math.PI / 4; // Max 45 degrees
        
        // Increase speed slightly on each paddle hit
        const currentSpeed = Math.sqrt(newSpeedX * newSpeedX + newSpeedY * newSpeedY);
        const newSpeed = currentSpeed + state.ballSpeedIncrement;
        
        // Apply new velocity with bounce angle
        newSpeedX = newSpeed * Math.cos(bounceAngle);
        newSpeedY = newSpeed * -Math.sin(bounceAngle);
        
        // Ensure ball moves away from paddle
        if (newSpeedX <= 0) {
          newSpeedX = Math.abs(newSpeedX);
        }
        
        newX = state.paddleWidth + state.ballSize / 2;
        
        // Play hit sound only for main ball
        if (ball.isMainBall) {
          audio.playHit();
        }
      }
      
      // Ball collision with computer paddle (right side)
      if (newX + state.ballSize / 2 >= state.canvasWidth - state.paddleWidth && 
          newY >= state.computerPaddleY - effectiveComputerPaddleHeight / 2 && 
          newY <= state.computerPaddleY + effectiveComputerPaddleHeight / 2) {
        
        // Calculate bounce angle based on hit position on paddle
        const relativeIntersectY = state.computerPaddleY - newY;
        const normalizedIntersection = relativeIntersectY / (effectiveComputerPaddleHeight / 2);
        const bounceAngle = normalizedIntersection * Math.PI / 4; // Max 45 degrees
        
        // Increase speed slightly on each paddle hit
        const currentSpeed = Math.sqrt(newSpeedX * newSpeedX + newSpeedY * newSpeedY);
        const newSpeed = currentSpeed + state.ballSpeedIncrement;
        
        // Apply new velocity with bounce angle
        newSpeedX = -newSpeed * Math.cos(bounceAngle);
        newSpeedY = newSpeed * -Math.sin(bounceAngle);
        
        // Ensure ball moves away from paddle
        if (newSpeedX >= 0) {
          newSpeedX = -Math.abs(newSpeedX);
        }
        
        newX = state.canvasWidth - state.paddleWidth - state.ballSize / 2;
        
        // Play hit sound only for main ball
        if (ball.isMainBall) {
          audio.playHit();
        }
      }
      
      // Return updated ball object
      return {
        ...ball,
        x: newX,
        y: newY,
        speedX: newSpeedX,
        speedY: newSpeedY,
      };
    },
  };
});
