import { Card } from "@/components/ui/card";
import { usePingPong } from "@/lib/stores/usePingPong";
import { useEffect, useState } from "react";

interface ScoreDisplayProps {
  playerScore: number;
  computerScore: number;
}

const ScoreDisplay = ({ playerScore, computerScore }: ScoreDisplayProps) => {
  // Get the difficulty name function from the store
  const getDifficultyName = usePingPong((state) => state.getDifficultyName);
  const currentLevel = usePingPong((state) => state.currentLevel);
  const isGameStarted = usePingPong((state) => state.isGameStarted);
  
  // State to track current difficulty name with color coding
  const [difficultyInfo, setDifficultyInfo] = useState({
    name: "Beginner",
    color: "text-green-600"
  });
  
  // Update difficulty display when level changes
  useEffect(() => {
    const diffName = getDifficultyName();
    
    // Set color based on difficulty level
    let diffColor = "text-green-600";
    if (currentLevel === 2) diffColor = "text-blue-600";
    else if (currentLevel === 3) diffColor = "text-amber-600";
    else if (currentLevel === 4) diffColor = "text-orange-600";
    else if (currentLevel === 5) diffColor = "text-red-600";
    
    setDifficultyInfo({
      name: diffName,
      color: diffColor
    });
  }, [currentLevel, getDifficultyName]);
  
  return (
    <div className="flex justify-between w-full mb-4">
      <Card className="px-4 py-2 bg-card text-card-foreground">
        <div className="text-center">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Player</p>
          <p className="text-4xl font-bold">{playerScore}</p>
        </div>
      </Card>
      
      <Card className="px-6 py-3 bg-primary text-primary-foreground">
        <div className="text-center flex flex-col items-center">
          <p className="text-sm uppercase font-semibold">PING PONG</p>
          {isGameStarted && (
            <div className="mt-1 px-2 py-0.5 rounded-full bg-black/20">
              <p className="text-xs font-medium">
                Level: <span className={`font-bold ${difficultyInfo.color}`}>{difficultyInfo.name}</span>
              </p>
            </div>
          )}
        </div>
      </Card>
      
      <Card className="px-4 py-2 bg-card text-card-foreground">
        <div className="text-center">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Computer</p>
          <p className="text-4xl font-bold">{computerScore}</p>
        </div>
      </Card>
    </div>
  );
};

export default ScoreDisplay;
