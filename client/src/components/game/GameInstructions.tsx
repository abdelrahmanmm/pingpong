import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

const GameInstructions = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return (
    <div className="mt-6 p-4 bg-card rounded-lg shadow-md text-card-foreground w-full">
      <h2 className="text-xl font-bold mb-2">How to Play</h2>
      <Separator className="mb-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Controls</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {isMobile ? (
              <li>Swipe up/down on the game area to move your paddle</li>
            ) : (
              <>
                <li>Use mouse movement up/down to control your paddle</li>
                <li>Arrow keys (Up/Down) or W/S keys to move paddle</li>
                <li>Space bar to start, pause, or restart the game</li>
              </>
            )}
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Rules</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li>First player to reach 5 points wins</li>
            <li>Score by getting the ball past your opponent's paddle</li>
            <li>The ball speed increases after each hit</li>
            <li>The computer's difficulty adjusts based on the score</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameInstructions;
