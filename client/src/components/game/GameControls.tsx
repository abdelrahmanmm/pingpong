import { Button } from "@/components/ui/button";
import { useAudio } from "@/lib/stores/useAudio";
import { usePingPong } from "@/lib/stores/usePingPong";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";

const GameControls = () => {
  const { isMuted, toggleMute } = useAudio();
  const { isGameStarted, isGameOver, isPaused, togglePause, startGame, restartGame } = usePingPong();

  const handleMainButtonClick = () => {
    if (isGameOver) {
      restartGame();
    } else if (!isGameStarted) {
      startGame();
      // Start background music when game starts
      useAudio.getState().playBackgroundMusic();
    } else {
      togglePause();
    }
  };

  const getMainButtonText = () => {
    if (isGameOver) {
      return "Restart";
    } else if (!isGameStarted) {
      return "Start Game";
    } else {
      return isPaused ? "Resume" : "Pause";
    }
  };

  const getMainButtonIcon = () => {
    if (isGameOver || !isGameStarted) {
      return <Play className="w-4 h-4 mr-2" />;
    } else {
      return isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800"
        onClick={toggleMute}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
      
      <Button
        size="sm"
        className="bg-primary text-white"
        onClick={handleMainButtonClick}
      >
        {getMainButtonIcon()}
        {getMainButtonText()}
      </Button>
    </div>
  );
};

export default GameControls;
