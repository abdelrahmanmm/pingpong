import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    <div className="mt-6 w-full flex justify-center gap-4">
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
          <ul className="list-disc ml-5 space-y-2 text-sm mt-4">
            {isMobile ? (
              <li>Swipe up/down on the game area to move your paddle</li>
            ) : (
              <>
                <li>Use mouse movement up/down to control your paddle</li>
                <li>Arrow keys (Up/Down) or W/S keys to move paddle</li>
                <li>Space bar to start, pause, or restart the game</li>
              </>
            )}
            <li className="text-cyan-500">Click anywhere on the game to start</li>
          </ul>
        </DialogContent>
      </Dialog>
      
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
          <ul className="list-disc ml-5 space-y-2 text-sm mt-4">
            <li>First player to reach 5 points wins</li>
            <li>Score by getting the ball past your opponent's paddle</li>
            <li>The ball speed increases after each hit</li>
            <li>The computer's difficulty adjusts based on the score</li>
            <li>The ball angle changes based on where it hits your paddle</li>
            <li>Hit the ball with the edge of your paddle for a steeper angle</li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameInstructions;
