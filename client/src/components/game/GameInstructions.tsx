import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const InstructionsContent = () => (
    <>
      <h2 className="text-xl font-bold mb-2">How to Play</h2>
      <Separator className="mb-4" />
      
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="controls" className="mt-3">
          <ul className="list-disc ml-5 space-y-2 text-sm">
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
        </TabsContent>
        
        <TabsContent value="rules" className="mt-3">
          <ul className="list-disc ml-5 space-y-2 text-sm">
            <li>First player to reach 5 points wins</li>
            <li>Score by getting the ball past your opponent's paddle</li>
            <li>The ball speed increases after each hit</li>
            <li>The computer's difficulty adjusts based on the score</li>
            <li>The ball angle changes based on where it hits your paddle</li>
            <li>Hit the ball with the edge of your paddle for a steeper angle</li>
          </ul>
        </TabsContent>
      </Tabs>
    </>
  );

  return (
    <div className="mt-6 w-full flex justify-center">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" size="lg" className="font-bold">
            How to Play
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Game Instructions</DialogTitle>
          </DialogHeader>
          <InstructionsContent />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameInstructions;
