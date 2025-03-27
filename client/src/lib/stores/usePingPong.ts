import { create } from "zustand";
import { useAudio } from "./useAudio";

type GameWinner = "player" | "computer" | null;

interface PingPongState {
  // Game dimensions
  canvasWidth: number;
  canvasHeight: number;
  paddleWidth: number;
  paddleHeight: number;
  ballSize: number;

  // Game positions
  playerPaddleY: number;
  computerPaddleY: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;

  // Game state
  playerScore: number;
  computerScore: number;
  isGameStarted: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  winner: GameWinner;
  
  // Game settings
  pointsToWin: number;
  initialBallSpeed: number;
  ballSpeedIncrement: number;
  
  // Methods
  initialize: () => void;
  updatePlayerPaddle: (y: number) => void;
  updateGame: () => void;
  startGame: () => void;
  restartGame: () => void;
  resetBall: () => void;
  togglePause: () => void;
  scorePoint: (player: "player" | "computer") => void;
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
        
        // Computer AI - move towards the ball with slight delay and limited prediction
        let computerPaddleTarget = state.computerPaddleY;
        
        // Only move computer paddle when ball is moving toward it
        if (state.ballSpeedX > 0) {
          const difficulty = Math.min(0.6 + (state.playerScore * 0.05), 0.9);
          
          // Add some prediction based on ball trajectory
          const predictedY = newBallY + (newBallSpeedY * 
            ((state.canvasWidth - newBallX) / newBallSpeedX) * difficulty);
          
          // Clamp the prediction to canvas bounds
          computerPaddleTarget = Math.max(
            state.paddleHeight / 2,
            Math.min(state.canvasHeight - state.paddleHeight / 2, predictedY)
          );
        }
        
        // Move computer paddle with a maximum speed
        const maxComputerPaddleSpeed = 5 + (state.playerScore * 0.5);
        let newComputerPaddleY = state.computerPaddleY;
        
        if (computerPaddleTarget > state.computerPaddleY) {
          newComputerPaddleY = Math.min(
            computerPaddleTarget, 
            state.computerPaddleY + maxComputerPaddleSpeed
          );
        } else if (computerPaddleTarget < state.computerPaddleY) {
          newComputerPaddleY = Math.max(
            computerPaddleTarget, 
            state.computerPaddleY - maxComputerPaddleSpeed
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
        
        // Check if ball goes beyond paddles (scoring)
        if (newBallX - state.ballSize / 2 <= 0) {
          // Computer scores
          return {
            ...state,
            ballX: newBallX,
            ballY: newBallY,
            ballSpeedX: newBallSpeedX,
            ballSpeedY: newBallSpeedY,
            computerPaddleY: newComputerPaddleY,
          };
        } else if (newBallX + state.ballSize / 2 >= state.canvasWidth) {
          // Player scores
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
      if (state.ballX - state.ballSize / 2 <= 0) {
        get().scorePoint("computer");
      } else if (state.ballX + state.ballSize / 2 >= state.canvasWidth) {
        get().scorePoint("player");
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
        
        if (player === "player") {
          playerScore += 1;
          if (playerScore >= state.pointsToWin) {
            isGameOver = true;
            winner = "player";
          }
        } else {
          computerScore += 1;
          if (computerScore >= state.pointsToWin) {
            isGameOver = true;
            winner = "computer";
          }
        }
        
        // If game continues, reset ball
        if (!isGameOver) {
          setTimeout(() => get().resetBall(), 1000);
        }
        
        return {
          playerScore,
          computerScore,
          isGameOver,
          winner,
        };
      });
    },
  };
});
