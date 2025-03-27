import { Card } from "@/components/ui/card";

interface ScoreDisplayProps {
  playerScore: number;
  computerScore: number;
}

const ScoreDisplay = ({ playerScore, computerScore }: ScoreDisplayProps) => {
  return (
    <div className="flex justify-between w-full mb-4">
      <Card className="px-4 py-2 bg-card text-card-foreground">
        <div className="text-center">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Player</p>
          <p className="text-4xl font-bold">{playerScore}</p>
        </div>
      </Card>
      
      <Card className="px-6 py-3 bg-primary text-primary-foreground">
        <div className="text-center">
          <p className="text-sm uppercase font-semibold">PING PONG</p>
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
