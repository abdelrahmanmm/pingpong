/**
 * Active Power-ups Display Component
 * 
 * This component displays currently active power-ups with their
 * names, icons, and remaining duration.
 */

import { useEffect, useState } from "react";
import { PowerUpTarget, PowerUpType, usePowerUps } from "../../lib/stores/usePowerUps";

// Mapping of power-up types to emoji icons
const POWER_UP_ICONS: Record<PowerUpType, string> = {
  [PowerUpType.SPEED_BOOST]: "🚀",
  [PowerUpType.MULTI_BALL]: "🔄",
  [PowerUpType.PADDLE_EXTENDER]: "📏",
  [PowerUpType.SLOW_MOTION]: "🐢",
  [PowerUpType.INVISIBILITY]: "👻",
  [PowerUpType.SHRINK_OPPONENT]: "🔍",
};

// Function to get human-readable name for a power-up target
const getTargetName = (target: PowerUpTarget): string => {
  switch (target) {
    case PowerUpTarget.PLAYER:
      return "You";
    case PowerUpTarget.COMPUTER:
      return "Computer";
    case PowerUpTarget.BALL:
      return "Ball";
    case PowerUpTarget.GAME:
      return "Game";
    default:
      return "";
  }
};

interface ActivePowerUpItemProps {
  type: PowerUpType;
  endTime: number;
  target: PowerUpTarget;
}

/**
 * Individual power-up item with timer
 */
const ActivePowerUpItem = ({ type, endTime, target }: ActivePowerUpItemProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const config = usePowerUps((state) => state.powerUpConfigs[type]);
  
  // Update the time remaining for this power-up
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
    };
    
    // Update immediately
    updateTimeLeft();
    
    // Update every 100ms
    const interval = setInterval(updateTimeLeft, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [endTime]);
  
  // Don't render if the power-up has expired
  if (timeLeft <= 0) {
    return null;
  }
  
  // Format the time remaining
  const secondsLeft = Math.ceil(timeLeft / 1000);
  
  return (
    <div className="flex items-center gap-2 bg-opacity-80 bg-slate-800 rounded-md p-2 mb-2">
      <div className="text-xl">{POWER_UP_ICONS[type]}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{config.name}</div>
        <div className="text-xs text-slate-300">{getTargetName(target)}</div>
      </div>
      <div className="text-sm font-mono bg-slate-700 px-2 py-1 rounded-sm">
        {secondsLeft}s
      </div>
    </div>
  );
};

/**
 * Main power-up display component
 * Shows all active power-ups
 */
const PowerUpDisplay = () => {
  const activePowerUps = usePowerUps((state) => state.activePowerUps);
  
  // No active power-ups, don't render anything
  if (activePowerUps.length === 0) {
    return null;
  }
  
  return (
    <div className="absolute top-4 right-4 w-48 z-10">
      <div className="text-sm font-semibold text-white bg-opacity-70 bg-slate-900 rounded-t-md p-2">
        Active Power-ups
      </div>
      <div className="p-2 bg-opacity-70 bg-slate-700 rounded-b-md">
        {activePowerUps.map((powerUp) => (
          <ActivePowerUpItem
            key={`${powerUp.type}-${powerUp.target}`}
            type={powerUp.type}
            endTime={powerUp.endTime}
            target={powerUp.target}
          />
        ))}
      </div>
    </div>
  );
};

export default PowerUpDisplay;