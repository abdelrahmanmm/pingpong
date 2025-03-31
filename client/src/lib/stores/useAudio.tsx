import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Interface for the game's audio system state management
 * Handles all sound effects and background music for the ping pong game
 */
interface AudioState {
  // Audio elements
  backgroundMusic: HTMLAudioElement | null;  // Background music that plays during gameplay
  hitSound: HTMLAudioElement | null;         // Sound effect for ball hitting paddles or walls
  successSound: HTMLAudioElement | null;     // Sound effect for scoring a point
  powerUpSound: HTMLAudioElement | null;     // Sound effect for collecting a power-up
  
  // Audio settings
  isMuted: boolean;                          // Whether all game audio is muted
  volume: number;                            // Master volume level (0.0 to 1.0)
  isBackgroundMusicPlaying: boolean;         // Whether background music is currently playing
  
  // Setter functions for initializing audio elements
  setBackgroundMusic: (music: HTMLAudioElement) => void;  // Set the background music audio element
  setHitSound: (sound: HTMLAudioElement) => void;         // Set the hit sound effect audio element
  setSuccessSound: (sound: HTMLAudioElement) => void;     // Set the success sound effect audio element
  setPowerUpSound: (sound: HTMLAudioElement) => void;     // Set the power-up sound effect audio element
  
  // Audio control functions
  toggleMute: () => void;                    // Toggle between muted and unmuted states
  setVolume: (volume: number) => void;       // Set the master volume level
  playHit: () => void;                       // Play the hit sound effect
  playSuccess: () => void;                   // Play the success sound effect
  playPowerUp: () => void;                   // Play the power-up sound effect
  playBackgroundMusic: () => void;           // Start playing the background music
  stopBackgroundMusic: () => void;           // Stop the background music
  
  // Audio asset management
  isAudioLoaded: boolean;                    // Whether all audio assets have been loaded
  setAudioLoaded: (loaded: boolean) => void; // Mark audio assets as loaded
}

/**
 * Zustand store for managing all game audio
 * Handles sound effects, background music, and mute state
 * Uses persist middleware to save audio preferences
 */
export const useAudio = create<AudioState>(
  persist(
    (set, get) => ({
      // Initial state
      backgroundMusic: null,            // Will be set after audio files are loaded
      hitSound: null,                   // Will be set after audio files are loaded
      successSound: null,               // Will be set after audio files are loaded
      powerUpSound: null,               // Will be set after audio files are loaded
      isMuted: true,                    // Start muted by default for better user experience
      volume: 0.7,                      // Default master volume (70%)
      isBackgroundMusicPlaying: false,  // Tracks if music is currently playing
      isAudioLoaded: false,             // Tracks if all audio assets have been loaded
      
      /**
       * Set background music audio element
       * @param music - HTMLAudioElement for background music
       */
      setBackgroundMusic: (music) => {
        if (music) {
          music.loop = true;
          music.volume = get().volume * 0.5; // Background music at 50% of master volume
        }
        set({ backgroundMusic: music });
      },
      
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
       * Set power-up sound effect audio element
       * @param sound - HTMLAudioElement for power-up sound
       */
      setPowerUpSound: (sound) => set({ powerUpSound: sound }),
      
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
       * Set the master volume level for all audio
       * @param volume - Volume level from 0.0 to 1.0
       */
      setVolume: (volume) => {
        // Ensure volume is between 0 and 1
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume in store
        set({ volume: normalizedVolume });
        
        // Apply to background music if loaded
        const { backgroundMusic } = get();
        if (backgroundMusic) {
          backgroundMusic.volume = normalizedVolume * 0.5; // 50% of master for background
        }
        
        console.log(`Volume set to ${normalizedVolume * 100}%`);
      },
      
      /**
       * Play the hit sound effect
       * Used when ball hits paddles or walls
       * Creates a clone of the sound for overlapping playback
       */
      playHit: () => {
        const { hitSound, isMuted, volume } = get();
        if (hitSound) {
          // If sound is muted, don't play anything
          if (isMuted) {
            console.log("Hit sound skipped (muted)");
            return;
          }
          
          // Clone the sound to allow overlapping playback
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = volume * 0.3;  // 30% of master volume for hits
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
        const { successSound, isMuted, volume } = get();
        if (successSound) {
          // If sound is muted, don't play anything
          if (isMuted) {
            console.log("Success sound skipped (muted)");
            return;
          }
          
          // Reset to beginning and play
          successSound.currentTime = 0;
          successSound.volume = volume * 0.6; // 60% of master volume for success
          successSound.play().catch(error => {
            console.log("Success sound play prevented:", error);
          });
        }
      },
      
      /**
       * Play the power-up sound effect
       * Used when a power-up is collected
       */
      playPowerUp: () => {
        const { powerUpSound, isMuted, volume } = get();
        if (powerUpSound) {
          // If sound is muted, don't play anything
          if (isMuted) {
            console.log("Power-up sound skipped (muted)");
            return;
          }
          
          // Reset to beginning and play
          powerUpSound.currentTime = 0;
          powerUpSound.volume = volume * 0.7; // 70% of master volume for power-ups
          powerUpSound.play().catch(error => {
            console.log("Power-up sound play prevented:", error);
          });
        }
      },
      
      /**
       * Start playing background music
       * Respects the current mute state
       */
      playBackgroundMusic: () => {
        const { backgroundMusic, isMuted, volume } = get();
        if (backgroundMusic) {
          // Set volume based on master volume
          backgroundMusic.volume = volume * 0.5; // 50% of master for background
          
          // Apply the current mute state
          backgroundMusic.muted = isMuted;
          backgroundMusic.loop = true;
          
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
      },
      
      /**
       * Mark audio assets as loaded or unloaded
       * @param loaded - Whether audio assets are loaded
       */
      setAudioLoaded: (loaded) => set({ isAudioLoaded: loaded })
    }),
    {
      name: "pingpong-audio-storage",
      partialize: (state) => ({ 
        isMuted: state.isMuted, 
        volume: state.volume 
      })
    }
  )
);
