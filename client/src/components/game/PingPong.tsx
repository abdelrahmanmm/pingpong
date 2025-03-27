import { useEffect, useRef, useState } from "react";
import { usePingPong } from "@/lib/stores/usePingPong";
import { useAudio } from "@/lib/stores/useAudio";
import GameControls from "./GameControls";
import GameInstructions from "./GameInstructions";
import ScoreDisplay from "./ScoreDisplay";

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

  useEffect(() => {
    // Initialize audio with error handling
    const hitSfx = new Audio("/sounds/hit.mp3");
    const successSfx = new Audio("/sounds/success.mp3");
    const backgroundMusic = new Audio("/sounds/background.mp3");
    
    // Handle loading errors
    hitSfx.onerror = () => console.error("Failed to load hit sound");
    successSfx.onerror = () => console.error("Failed to load success sound");
    backgroundMusic.onerror = () => console.error("Failed to load background music");
    
    // Configure background music
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    
    // Set the audio files in our store
    setHitSound(hitSfx);
    setSuccessSound(successSfx);
    setBackgroundMusic(backgroundMusic);

    // Initialize game dimensions based on screen size
    initialize();
    setIsInitialized(true);

    // Add window resize listener
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      initialize(); // Re-initialize game dimensions on resize
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [initialize, setHitSound, setSuccessSound, setBackgroundMusic]);

  // Handle rendering the game on canvas
  useEffect(() => {
    if (!canvasRef.current || !isInitialized) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

  // Handle mouse/touch move for paddle control
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

  // Handle canvas click to start game
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

  // Handle key presses for game control
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
