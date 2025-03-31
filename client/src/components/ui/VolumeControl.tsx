import React, { useState, useEffect } from 'react';
import { VolumeX, Volume1, Volume2 } from 'lucide-react';
import { Slider } from './slider';
import { useAudio } from '../../lib/stores/useAudio';

interface VolumeControlProps {
  className?: string;
  compact?: boolean; // Compact mode for smaller screens
}

/**
 * Volume Control Component
 * Provides a slider to adjust game volume and a button to toggle mute
 */
export const VolumeControl: React.FC<VolumeControlProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { volume, isMuted, setVolume, toggleMute } = useAudio();
  
  // Local volume state for immediate UI feedback
  const [localVolume, setLocalVolume] = useState(volume * 100);
  
  // Update local volume when the store volume changes
  useEffect(() => {
    setLocalVolume(volume * 100);
  }, [volume]);
  
  // Handle volume slider changes
  const handleVolumeChange = (newValue: number[]) => {
    const newVolume = newValue[0] / 100;
    setLocalVolume(newValue[0]);
    setVolume(newVolume);
  };
  
  // Determine which volume icon to show based on volume level and mute state
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleMute}
        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>
      
      {!compact && (
        <Slider
          value={[localVolume]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="w-24" // Adjust width as needed
          aria-label="Volume"
        />
      )}
    </div>
  );
};