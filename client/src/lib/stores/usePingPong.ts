import { create } from "zustand";
import { useAudio } from "./useAudio";

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
  ballX: number;               // X-position of ball center
  ballY: number;               // Y-position of ball center
  ballSpeedX: number;          // Horizontal speed of ball (pixels per frame)
  ballSpeedY: number;          // Vertical speed of ball (pixels per frame)

  // Game state
  playerScore: number;         // Current score of the player
  computerScore: number;       // Current score of the computer
  isGameStarted: boolean;      // Whether the game has been started
  isGameOver: boolean;         // Whether the game has ended
  isPaused: boolean;           // Whether the game is currently paused
  winner: GameWinner;          // Who won the game, if it's over
  
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

    // Game state
    playerScore: 0,
    computerScore: 0,
    isGameStarted: false,
    isGameOver: false,
    isPaused: false,
    winner: null,
    
    // Game settings
    pointsToWin: 5,
    initialBallSpeed: 5,
    ballSpeedIncrement: 0.2,
    
    // Difficulty settings
    currentLevel: 1 as DifficultyLevel,
    maxLevel: 5 as DifficultyLevel,
    computerBaseSpeed: 4,
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
      set((state) => {
        const audio = useAudio.getState();
        
        // Move the ball
        let newBallX = state.ballX + state.ballSpeedX;
        let newBallY = state.ballY + state.ballSpeedY;
        let newBallSpeedX = state.ballSpeedX;
        let newBallSpeedY = state.ballSpeedY;
        
        // Ball collision with top and bottom walls
        if (newBallY - state.ballSize / 2 <= 0 || 
            newBallY + state.ballSize / 2 >= state.canvasHeight) {
          newBallSpeedY = -newBallSpeedY;
          audio.playHit();
        }
        
        // Computer AI - move towards the ball with prediction based on difficulty level
        let computerPaddleTarget = state.computerPaddleY;
        
        // Only move computer paddle when ball is moving toward it
        if (state.ballSpeedX > 0) {
          // Use the prediction accuracy based on current difficulty level
          const currentAccuracy = state.predictionAccuracy;
          
          // Add prediction based on ball trajectory (more accurate at higher levels)
          const predictedY = newBallY + (newBallSpeedY * 
            ((state.canvasWidth - newBallX) / newBallSpeedX) * currentAccuracy);
          
          // Add some randomness at lower difficulty levels
          const randomFactor = Math.max(0, (1 - currentAccuracy) * 20);
          const randomOffset = randomFactor > 0 
            ? (Math.random() * randomFactor - randomFactor/2) 
            : 0;
          
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
        
        // Ball collision with player paddle (left side)
        if (newBallX - state.ballSize / 2 <= state.paddleWidth && 
            newBallY >= state.playerPaddleY - state.paddleHeight / 2 && 
            newBallY <= state.playerPaddleY + state.paddleHeight / 2) {
          
          // Calculate bounce angle based on where the ball hits the paddle
          const relativeIntersectY = state.playerPaddleY - newBallY;
          const normalizedRelativeIntersectionY = relativeIntersectY / (state.paddleHeight / 2);
          const bounceAngle = normalizedRelativeIntersectionY * Math.PI / 4; // Max 45 degree angle
          
          // Calculate new ball speed
          const speed = Math.sqrt(newBallSpeedX * newBallSpeedX + newBallSpeedY * newBallSpeedY);
          const newSpeed = speed + state.ballSpeedIncrement;
          
          newBallSpeedX = newSpeed * Math.cos(bounceAngle);
          newBallSpeedY = newSpeed * -Math.sin(bounceAngle);
          
          // Ensure the ball moves away from the paddle
          if (newBallSpeedX <= 0) {
            newBallSpeedX = Math.abs(newBallSpeedX);
          }
          
          newBallX = state.paddleWidth + state.ballSize / 2;
          audio.playHit();
        }
        
        // Ball collision with computer paddle (right side)
        if (newBallX + state.ballSize / 2 >= state.canvasWidth - state.paddleWidth && 
            newBallY >= newComputerPaddleY - state.paddleHeight / 2 && 
            newBallY <= newComputerPaddleY + state.paddleHeight / 2) {
          
          // Calculate bounce angle based on where the ball hits the paddle
          const relativeIntersectY = newComputerPaddleY - newBallY;
          const normalizedRelativeIntersectionY = relativeIntersectY / (state.paddleHeight / 2);
          const bounceAngle = normalizedRelativeIntersectionY * Math.PI / 4; // Max 45 degree angle
          
          // Calculate new ball speed
          const speed = Math.sqrt(newBallSpeedX * newBallSpeedX + newBallSpeedY * newBallSpeedY);
          const newSpeed = speed + state.ballSpeedIncrement;
          
          newBallSpeedX = -newSpeed * Math.cos(bounceAngle);
          newBallSpeedY = newSpeed * -Math.sin(bounceAngle);
          
          // Ensure the ball moves away from the paddle
          if (newBallSpeedX >= 0) {
            newBallSpeedX = -Math.abs(newBallSpeedX);
          }
          
          newBallX = state.canvasWidth - state.paddleWidth - state.ballSize / 2;
          audio.playHit();
        }
        
        // Check if ball goes beyond paddles but DON'T handle scoring here
        // Scoring is handled separately after this update to ensure state consistency
        if (newBallX - state.ballSize / 2 <= 0 || newBallX + state.ballSize / 2 >= state.canvasWidth) {
          // Just update positions, scoring will be handled in the check after this function
          return {
            ...state,
            ballX: newBallX,
            ballY: newBallY,
            ballSpeedX: newBallSpeedX,
            ballSpeedY: newBallSpeedY,
            computerPaddleY: newComputerPaddleY,
          };
        }
        
        // If no scoring happened, just update positions
        return {
          ballX: newBallX,
          ballY: newBallY,
          ballSpeedX: newBallSpeedX,
          ballSpeedY: newBallSpeedY,
          computerPaddleY: newComputerPaddleY,
        };
      });
      
      // Check for scoring after updating positions
      const state = get();
      
      // Computer scores when ball passes left edge
      if (state.ballX - state.ballSize / 2 <= 0) {
        // Only score if the game is in progress
        if (state.isGameStarted && !state.isGameOver && !state.isPaused) {
          console.log("Computer scored a point");
          get().scorePoint("computer");
        }
      } 
      // Player scores when ball passes right edge
      else if (state.ballX + state.ballSize / 2 >= state.canvasWidth) {
        // Only score if the game is in progress
        if (state.isGameStarted && !state.isGameOver && !state.isPaused) {
          console.log("Player scored a point");
          get().scorePoint("player");
        }
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
      });
      get().resetBall();
    },

    // Reset ball to center with random direction
    resetBall: () => {
      set((state) => {
        // Randomize initial ball direction but ensure it moves horizontally
        const direction = Math.random() > 0.5 ? 1 : -1;
        const angle = (Math.random() * Math.PI / 4) - Math.PI / 8; // -22.5 to 22.5 degrees
        
        return {
          ballX: state.canvasWidth / 2,
          ballY: state.canvasHeight / 2,
          ballSpeedX: state.initialBallSpeed * direction * Math.cos(angle),
          ballSpeedY: state.initialBallSpeed * Math.sin(angle),
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
          }
        } else {
          computerScore += 1;
          console.log(`Computer score is now: ${computerScore}`);
          if (computerScore >= state.pointsToWin) {
            isGameOver = true;
            winner = "computer";
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
  };
});
