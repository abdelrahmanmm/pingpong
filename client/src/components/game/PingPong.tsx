import { useEffect, useRef, useState } from "react";
import { usePingPong } from "@/lib/stores/usePingPong";
import { useAudio } from "@/lib/stores/useAudio";
import { usePowerUps, PowerUpTarget } from "@/lib/stores/usePowerUps";
import GameControls from "./GameControls";
import GameInstructions from "./GameInstructions";
import ScoreDisplay from "./ScoreDisplay";
import DifficultySelector from "./DifficultySelector";
import PowerUpDisplay from "./PowerUpDisplay";

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
    balls, // Add balls array for multiball support
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
  
  // Get power-up functions
  const { 
    spawnPowerUp, 
    spawnedPowerUps, 
    collectPowerUp, 
    checkExpiredPowerUps,
    enablePowerUps,
    disablePowerUps,
    getPlayerPaddleHeightMultiplier,
    getComputerPaddleHeightMultiplier,
    getBallSpeedMultiplier,
    getBallOpacity,
  } = usePowerUps();

  /**
   * Component initialization effect
   * - Loads and configures audio assets
   * - Initializes game dimensions based on screen size
   * - Sets up window resize handler for responsive layout
   */
  useEffect(() => {
    // Import the asset utilities
    import("@/lib/assetUtils").then(({ getSoundUrl }) => {
      // Initialize audio with error handling and corrected paths
      const hitSfx = new Audio(getSoundUrl("hit.mp3"));
      const successSfx = new Audio(getSoundUrl("success.mp3"));
      const backgroundMusic = new Audio(getSoundUrl("background.mp3"));
      
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
    }).catch(error => {
      console.error("Error loading sound assets:", error);
    });

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
   * Power-up management effect
   * - Spawns power-ups at intervals when game is active
   * - Checks for expired power-ups and removes them
   */
  useEffect(() => {
    // Only manage power-ups when game is active
    if (!isGameStarted || isGameOver || isPaused) {
      return;
    }
    
    // Process power-ups every 500ms
    const powerUpInterval = setInterval(() => {
      if (canvasRef.current) {
        // Try to spawn a new power-up
        spawnPowerUp(canvasRef.current.width, canvasRef.current.height);
        
        // Check for expired power-ups
        checkExpiredPowerUps();
      }
    }, 500);
    
    return () => {
      clearInterval(powerUpInterval);
    };
  }, [isGameStarted, isGameOver, isPaused, spawnPowerUp, checkExpiredPowerUps]);

  /**
   * Game state change handler for power-ups
   * Enables or disables power-ups based on game state
   */
  useEffect(() => {
    if (isGameStarted && !isGameOver) {
      enablePowerUps();
    } else if (isGameOver) {
      disablePowerUps();
    }
  }, [isGameStarted, isGameOver, enablePowerUps, disablePowerUps]);

  /**
   * Game rendering effect
   * Handles all canvas drawing operations including:
   * - Game background and table
   * - Player and computer paddles
   * - Ball movement
   * - Power-ups
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

    // Apply power-up effects to paddle dimensions
    const playerPaddleHeightWithPowerUps = paddleHeight * getPlayerPaddleHeightMultiplier();
    const computerPaddleHeightWithPowerUps = paddleHeight * getComputerPaddleHeightMultiplier();

    // Draw paddles
    ctx.fillStyle = "#ffffff";
    
    // Player paddle (left)
    ctx.fillRect(
      0,
      playerPaddleY - playerPaddleHeightWithPowerUps / 2,
      paddleWidth,
      playerPaddleHeightWithPowerUps
    );
    
    // Computer paddle (right)
    ctx.fillRect(
      canvas.width - paddleWidth,
      computerPaddleY - computerPaddleHeightWithPowerUps / 2,
      paddleWidth,
      computerPaddleHeightWithPowerUps
    );

    // Draw power-ups
    spawnedPowerUps.forEach((powerUp) => {
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
      ctx.fillStyle = powerUp.color;
      ctx.fill();
      
      // Add a pulsing glow effect to power-ups
      const time = Date.now() * 0.001; // Convert to seconds for smoother animation
      const pulseSize = 1 + Math.sin(time * 4) * 0.1; // Pulse between 0.9 and 1.1 size
      
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, powerUp.radius * pulseSize * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `${powerUp.color}40`; // Add transparency for glow
      ctx.fill();
      
      // Check if any ball hits a power-up (supports multiball)
      if (isGameStarted && !isGameOver && !isPaused) {
        balls.forEach(ball => {
          const distance = Math.sqrt(Math.pow(powerUp.x - ball.x, 2) + Math.pow(powerUp.y - ball.y, 2));
          if (distance <= (powerUp.radius + ballSize / 2)) {
            
            // Determine which player collects the power-up based on ball direction
            // If ball is moving right, player collects; if moving left, computer collects
            const isPlayerCollecting = ball.speedX > 0; // Ball moving right means player last hit it
            
            // Ball touched the power-up, collect it with the correct collector
            const collectedType = collectPowerUp(powerUp.id, isPlayerCollecting);
            if (collectedType) {
              console.log(`${isPlayerCollecting ? 'Player' : 'Computer'} collected power-up: ${collectedType}`);
              // Play success sound when power-up is collected
              useAudio.getState().playSuccess();
            }
          }
        });
      }
    });

    // Draw ball with power-up effects (invisibility)
    // Draw all balls (main ball + any extra balls from multiball power-up)
    if (isGameStarted && !isGameOver && !isPaused) {
      // Apply ball opacity power-up effect
      ctx.globalAlpha = getBallOpacity();
      ctx.fillStyle = "#ffffff";
      
      // Render all active balls in the multiball system
      balls.forEach((ball, index) => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add visual distinction for extra balls (slight glow effect)
        if (!ball.isMainBall) {
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballSize / 2 + 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = getBallOpacity(); // Reset to power-up opacity
        }
      });
      
      ctx.globalAlpha = 1.0; // Reset opacity
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
    spawnedPowerUps,
    collectPowerUp,
    getPlayerPaddleHeightMultiplier,
    getComputerPaddleHeightMultiplier,
    getBallOpacity,
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
      
      {/* Difficulty selector - Only shown before game starts or when game is over */}
      {(!isGameStarted || isGameOver) && <DifficultySelector />}
      
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
        
        {/* Display active power-ups when game is in progress */}
        {isGameStarted && !isGameOver && <PowerUpDisplay />}
      </div>
      
      <GameInstructions />
    </div>
  );
};

export default PingPong;
