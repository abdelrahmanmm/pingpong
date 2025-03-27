import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";

/**
 * GameInstructions Component
 * Provides game controls and rules in separate dialog boxes
 */
const GameInstructions = () => {
  // Track if the device is mobile for showing appropriate controls
  const [isMobile, setIsMobile] = useState(false);

  // Check device type on mount and when window resizes
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkDevice();
    
    // Add resize listener
    window.addEventListener('resize', checkDevice);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Define content directly in JSX for better debugging
  const controlsContent = (
    <div className="text-black font-semibold">
      <div className="mb-4 bg-blue-100 p-3 rounded">
        <h3 className="text-blue-700 font-bold text-lg mb-2">Movement:</h3>
        {isMobile ? (
          <p className="text-blue-800">• Swipe up/down on the game area to move your paddle</p>
        ) : (
          <>
            <p className="text-blue-800">• Mouse: Move up/down to control your paddle</p>
            <p className="text-blue-800">• Keyboard: Arrow Keys (Up/Down) or W/S keys</p>
          </>
        )}
      </div>
      
      <div className="bg-green-100 p-3 rounded">
        <h3 className="text-green-700 font-bold text-lg mb-2">Game Actions:</h3>
        <p className="text-green-800">• Click anywhere or press Space to start the game</p>
        <p className="text-green-800">• Press Space to pause/resume during gameplay</p>
        <p className="text-green-800">• Click or press Space to restart after game over</p>
      </div>
    </div>
  );
  
  const rulesContent = (
    <div className="text-black font-semibold">
      <div className="mb-4 bg-purple-100 p-3 rounded">
        <h3 className="text-purple-700 font-bold text-lg mb-2">Scoring:</h3>
        <p className="text-purple-800">• First player to reach 5 points wins</p>
        <p className="text-purple-800">• Score by getting the ball past your opponent's paddle</p>
      </div>
      
      <div className="mb-4 bg-amber-100 p-3 rounded">
        <h3 className="text-amber-700 font-bold text-lg mb-2">Gameplay:</h3>
        <p className="text-amber-800">• The ball speed increases after each hit</p>
        <p className="text-amber-800">• Ball angle changes based on where it hits your paddle</p>
        <p className="text-amber-800">• Hit with the edge of your paddle for steeper angles</p>
      </div>
      
      <div className="bg-orange-100 p-3 rounded">
        <h3 className="text-orange-700 font-bold text-lg mb-2">Difficulty Levels:</h3>
        <p className="text-orange-800">• Game starts at <span className="font-bold text-green-700">Beginner</span> level</p>
        <p className="text-orange-800">• Computer gets faster every 3 points you score</p>
        <p className="text-orange-800">• 5 levels: Beginner → Easy → Medium → Hard → Expert</p>
        <p className="text-orange-800">• Each level increases computer paddle speed and accuracy</p>
      </div>
    </div>
  );

  return (
    <div className="mt-6 w-full flex justify-center gap-4">
      {/* Controls Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" size="lg" className="font-bold">
            Controls
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-600">Game Controls</DialogTitle>
          </DialogHeader>
          {controlsContent}
        </DialogContent>
      </Dialog>
      
      {/* Rules Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className="font-bold">
            Rules
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-600">Game Rules</DialogTitle>
          </DialogHeader>
          {rulesContent}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameInstructions;
