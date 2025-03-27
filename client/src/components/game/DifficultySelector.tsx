import { useMemo } from "react";
import { usePingPong, DifficultyLevel } from "@/lib/stores/usePingPong";
import { Label } from "@/components/ui/label";

/**
 * DifficultySelector Component
 * Allows users to manually select a difficulty level for the computer opponent
 */
const DifficultySelector = () => {
  // Get the current level from the store
  const currentLevel = usePingPong((state) => state.currentLevel);
  const setDifficultyLevel = usePingPong((state) => state.setDifficultyLevel);
  
  // Create difficulty levels array
  const difficultyLevels = useMemo(() => [
    { level: 1 as DifficultyLevel, name: "Beginner", color: "bg-green-600 hover:bg-green-700" },
    { level: 2 as DifficultyLevel, name: "Easy", color: "bg-blue-600 hover:bg-blue-700" },
    { level: 3 as DifficultyLevel, name: "Medium", color: "bg-amber-600 hover:bg-amber-700" },
    { level: 4 as DifficultyLevel, name: "Hard", color: "bg-orange-600 hover:bg-orange-700" },
    { level: 5 as DifficultyLevel, name: "Expert", color: "bg-red-600 hover:bg-red-700" },
  ], []);
  
  // Handle selecting a different difficulty level
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setDifficultyLevel(level);
  };
  
  return (
    <div className="flex flex-col items-center mt-5 mb-2">
      <Label className="text-muted-foreground font-medium mb-2">
        Computer Difficulty:
      </Label>
      
      <div className="flex gap-2 flex-wrap justify-center">
        {difficultyLevels.map((diffLevel) => (
          <button
            key={diffLevel.level}
            onClick={() => handleDifficultyChange(diffLevel.level)}
            className={`px-3 py-1 rounded-full text-white text-sm font-medium transition-all
              ${diffLevel.color} 
              ${currentLevel === diffLevel.level ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70'}
            `}
          >
            {diffLevel.name}
          </button>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Higher difficulty = Faster & smarter computer
      </p>
    </div>
  );
};

export default DifficultySelector;