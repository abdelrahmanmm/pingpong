import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
            <DialogTitle>Game Controls</DialogTitle>
            <DialogDescription>
              How to control the game
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <h3 className="font-medium">Movement:</h3>
            {isMobile ? (
              <p>• Swipe up/down on the game area to move your paddle</p>
            ) : (
              <div className="space-y-2">
                <p>• Mouse: Move up/down to control your paddle</p>
                <p>• Keyboard: Arrow Keys (Up/Down) or W/S keys</p>
              </div>
            )}
            
            <h3 className="font-medium">Game Actions:</h3>
            <div className="space-y-2">
              <p>• Click anywhere or press Space to start the game</p>
              <p>• Press Space to pause/resume during gameplay</p>
              <p>• Click or press Space to restart after game over</p>
            </div>
          </div>
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
            <DialogTitle>Game Rules</DialogTitle>
            <DialogDescription>
              How the game works
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <h3 className="font-medium">Scoring:</h3>
            <div className="space-y-2">
              <p>• First player to reach 5 points wins</p>
              <p>• Score by getting the ball past your opponent's paddle</p>
            </div>
            
            <h3 className="font-medium">Gameplay:</h3>
            <div className="space-y-2">
              <p>• The ball speed increases after each hit</p>
              <p>• The computer's difficulty adjusts based on the score</p>
              <p>• Ball angle changes based on where it hits your paddle</p>
              <p>• Hit with the edge of your paddle for steeper angles</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameInstructions;
