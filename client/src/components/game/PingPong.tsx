import { useEffect, useRef, useState } from "react";
import { usePingPong } from "@/lib/stores/usePingPong";
import { useAudio } from "@/lib/stores/useAudio";
import GameControls from "./GameControls";
import GameInstructions from "./GameInstructions";
import ScoreDisplay from "./ScoreDisplay";

/**
 * Main Ping Pong Game Component
 * 
 * Handles the game canvas, rendering, user interaction, and coordinates
 * the overall game experience. This component is responsible for:
 * - Rendering the game elements (paddles, ball, UI messages)
 * - Handling user input (mouse, touch, keyboard)
 * - Managing audio (connecting game events to sounds)
 * - Coordinating responsive sizing for different devices
 * 
 * @returns The complete ping pong game interface
 */
const PingPong = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const {
    paddleHeight,
    paddleWidth,
    ballSize,
    playerPaddleY,
    computerPaddleY,
    ballX,
    ballY,
    playerScore,
    computerScore,
    isGameOver,
    isGameStarted,
    winner,
    initialize,
    startGame,
    restartGame,
    updatePlayerPaddle,
    togglePause,
    isPaused,
  } = usePingPong();

  const { setHitSound, setSuccessSound, setBackgroundMusic } = useAudio();

  /**
   * Component initialization effect
   * - Loads and configures audio assets
   * - Initializes game dimensions based on screen size
   * - Sets up window resize handler for responsive layout
   */
  useEffect(() => {
    // Initialize audio with error handling
    const hitSfx = new Audio("/sounds/hit.mp3");
    const successSfx = new Audio("/sounds/success.mp3");
    const backgroundMusic = new Audio("/sounds/background.mp3");
    
    // Handle loading errors for better debugging
    hitSfx.onerror = () => console.error("Failed to load hit sound");
    successSfx.onerror = () => console.error("Failed to load success sound");
    backgroundMusic.onerror = () => console.error("Failed to load background music");
    
    // Configure background music properties
    backgroundMusic.loop = true;          // Music should loop continuously
    backgroundMusic.volume = 0.5;         // Set to 50% volume to not overpower game sounds
    
    // Set the audio files in our global store for access throughout the game
    setHitSound(hitSfx);
    setSuccessSound(successSfx);
    setBackgroundMusic(backgroundMusic);

    // Initialize game dimensions based on current screen size
    initialize();
    setIsInitialized(true);

    // Add window resize listener for responsive layout
    const handleResize = () => {
      // Update our stored window dimensions
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      // Re-initialize game dimensions to match new screen size
      initialize();
    };

    window.addEventListener("resize", handleResize);
    
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [initialize, setHitSound, setSuccessSound, setBackgroundMusic]);

  /**
   * Game rendering effect
   * Handles all canvas drawing operations including:
   * - Game background and table
   * - Player and computer paddles
   * - Ball movement
   * - Game state messages (start, pause, game over)
   * 
   * Rerenders whenever game state or positions change
   */
  useEffect(() => {
    // Skip rendering if canvas isn't ready or game isn't initialized
    if (!canvasRef.current || !isInitialized) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Exit if canvas context cannot be obtained

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background (table)
    ctx.fillStyle = "#0a3142";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#ffffff";
    // Player paddle (left)
    ctx.fillRect(
      0,
      playerPaddleY - paddleHeight / 2,
      paddleWidth,
      paddleHeight
    );
    // Computer paddle (right)
    ctx.fillRect(
      canvas.width - paddleWidth,
      computerPaddleY - paddleHeight / 2,
      paddleWidth,
      paddleHeight
    );

    // Draw ball
    if (isGameStarted && !isGameOver && !isPaused) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw "Start Game" message if not started
    if (!isGameStarted && !isGameOver) {
      ctx.font = "20px 'Inter', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(
        "Click or Press Space to Start",
        canvas.width / 2,
        canvas.height / 2
      );
    }

    // Draw pause message if paused
    if (isPaused && isGameStarted && !isGameOver) {
      ctx.font = "20px 'Inter', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
      ctx.fillText(
        "Press Space to Continue",
        canvas.width / 2,
        canvas.height / 2 + 30
      );
    }

    // Draw game over message
    if (isGameOver) {
      ctx.font = "24px 'Inter', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(
        `Game Over! ${winner === "player" ? "You Win!" : "Computer Wins!"}`,
        canvas.width / 2,
        canvas.height / 2 - 20
      );
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText(
        "Press Space to Restart",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
  }, [
    ballX,
    ballY,
    ballSize,
    playerPaddleY,
    computerPaddleY,
    paddleHeight,
    paddleWidth,
    isGameStarted,
    isGameOver,
    isPaused,
    isInitialized,
    winner,
  ]);

  /**
   * Mouse/Touch movement handler
   * Controls the player paddle position based on cursor/finger position
   * Supports both mouse and touch events for cross-device compatibility
   * @param e - Mouse or Touch event
   */
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isGameOver || !isGameStarted || isPaused) return;

    let clientY: number;
    if ("touches" in e) {
      // Touch event
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientY = e.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    updatePlayerPaddle(relativeY);
  };

  /**
   * Canvas click handler
   * Manages game state transitions based on clicks:
   * - Starts a new game when in ready state
   * - Restarts the game when in game over state
   * - Handles appropriate audio transitions for each state
   */
  const handleCanvasClick = () => {
    if (isGameOver) {
      restartGame();
      // Restart the background music when game is restarted
      useAudio.getState().stopBackgroundMusic();
      useAudio.getState().playBackgroundMusic();
    } else if (!isGameStarted) {
      startGame();
      // Start background music when game starts
      useAudio.getState().playBackgroundMusic();
    }
  };

  /**
   * Keyboard controls effect
   * Handles all keyboard input for the game:
   * - Space: Start game, pause/resume, or restart after game over
   * - Arrow Up/W: Move paddle up
   * - Arrow Down/S: Move paddle down
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (isGameOver) {
          restartGame();
          // Restart the background music when game is restarted
          useAudio.getState().stopBackgroundMusic();
          useAudio.getState().playBackgroundMusic();
        } else if (!isGameStarted) {
          startGame();
          // Start background music when game starts
          useAudio.getState().playBackgroundMusic();
        } else {
          togglePause();
        }
      }

      // Paddle movement with keys
      if (!isGameOver && isGameStarted && !isPaused) {
        if (e.key === "ArrowUp" || e.key === "w") {
          updatePlayerPaddle(playerPaddleY - 20);
        } else if (e.key === "ArrowDown" || e.key === "s") {
          updatePlayerPaddle(playerPaddleY + 20);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isGameStarted,
    isGameOver,
    isPaused,
    startGame,
    restartGame,
    togglePause,
    updatePlayerPaddle,
    playerPaddleY,
  ]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl px-4">
      <ScoreDisplay playerScore={playerScore} computerScore={computerScore} />
      
      <div className="relative w-full aspect-[4/3] max-h-[70vh] rounded-lg overflow-hidden border-4 border-gray-900 shadow-lg">
        <canvas
          ref={canvasRef}
          width={windowDimensions.width < 768 ? 400 : 800}
          height={windowDimensions.width < 768 ? 300 : 600}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onClick={handleCanvasClick}
        />
        <GameControls />
      </div>
      
      <GameInstructions />
    </div>
  );
};

export default PingPong;
