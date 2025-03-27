import { create } from "zustand";

/**
 * Interface for the game's audio system state management
 * Handles all sound effects and background music for the ping pong game
 */
interface AudioState {
  // Audio elements
  backgroundMusic: HTMLAudioElement | null;  // Background music that plays during gameplay
  hitSound: HTMLAudioElement | null;         // Sound effect for ball hitting paddles or walls
  successSound: HTMLAudioElement | null;     // Sound effect for scoring a point
  
  // State flags
  isMuted: boolean;                          // Whether all game audio is muted
  isBackgroundMusicPlaying: boolean;         // Whether background music is currently playing
  
  // Setter functions for initializing audio elements
  setBackgroundMusic: (music: HTMLAudioElement) => void;  // Set the background music audio element
  setHitSound: (sound: HTMLAudioElement) => void;         // Set the hit sound effect audio element
  setSuccessSound: (sound: HTMLAudioElement) => void;     // Set the success sound effect audio element
  
  // Audio control functions
  toggleMute: () => void;                    // Toggle between muted and unmuted states
  playHit: () => void;                       // Play the hit sound effect
  playSuccess: () => void;                   // Play the success sound effect
  playBackgroundMusic: () => void;           // Start playing the background music
  stopBackgroundMusic: () => void;           // Stop the background music
}

/**
 * Zustand store for managing all game audio
 * Handles sound effects, background music, and mute state
 */
export const useAudio = create<AudioState>((set, get) => ({
  // Initial state
  backgroundMusic: null,            // Will be set after audio files are loaded
  hitSound: null,                   // Will be set after audio files are loaded
  successSound: null,               // Will be set after audio files are loaded
  isMuted: true,                    // Start muted by default for better user experience
  isBackgroundMusicPlaying: false,  // Tracks if music is currently playing
  
  /**
   * Set background music audio element
   * @param music - HTMLAudioElement for background music
   */
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  
  /**
   * Set hit sound effect audio element
   * @param sound - HTMLAudioElement for hit sound
   */
  setHitSound: (sound) => set({ hitSound: sound }),
  
  /**
   * Set success sound effect audio element
   * @param sound - HTMLAudioElement for success sound
   */
  setSuccessSound: (sound) => set({ successSound: sound }),
  
  /**
   * Toggle between muted and unmuted states
   * Handles applying mute state to all audio elements
   */
  toggleMute: () => {
    const { isMuted, isBackgroundMusicPlaying, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // If background music is playing, handle it accordingly
    if (backgroundMusic) {
      backgroundMusic.muted = newMutedState;
      
      if (isBackgroundMusicPlaying && !newMutedState) {
        // If we're unmuting and music should be playing, make sure it starts
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      }
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  /**
   * Play the hit sound effect
   * Used when ball hits paddles or walls
   * Creates a clone of the sound for overlapping playback
   */
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;  // Lower volume for hit sound as it plays frequently
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  /**
   * Play the success sound effect
   * Used when a point is scored
   * Resets current time to ensure it plays from the beginning
   */
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      // Reset to beginning and play
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  /**
   * Start playing background music
   * Respects the current mute state
   */
  playBackgroundMusic: () => {
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic) {
      // Apply the current mute state
      backgroundMusic.muted = isMuted;
      
      // Start the music (if unmuted, it will play audibly)
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
      
      // Update playing state regardless of mute state
      set({ isBackgroundMusicPlaying: true });
      console.log("Background music started");
    }
  },
  
  /**
   * Stop background music and reset to beginning
   */
  stopBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      set({ isBackgroundMusicPlaying: false });
      console.log("Background music stopped");
    }
  }
}));
