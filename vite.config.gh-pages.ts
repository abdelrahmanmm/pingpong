/**
 * Vite Configuration for GitHub Pages Deployment
 * 
 * This configuration file is specifically designed to build the application
 * for GitHub Pages hosting. It differs from the standard vite.config.ts in
 * several key ways:
 * 
 * 1. It removes the Replit-specific error overlay plugin
 * 2. It configures relative path URLs using base='./'
 * 3. It disables chunk hashing to prevent build version ID conflicts
 * 4. It includes explicit asset handling for sounds, models, and other media
 * 
 * @file vite.config.gh-pages.ts
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl"; // For shader support

// Convert ESM meta URLs to file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Include only the necessary plugins for static deployment
  plugins: [
    react(),
    glsl(), // Enables loading .glsl, .vert, .frag shader files
  ],
  
  // Maintain the same path aliases as the development config
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  
  // Set client directory as the root of the project
  root: path.resolve(__dirname, "client"),
  
  // Use relative paths for all assets - critical for GitHub Pages subpath hosting
  base: "./", 
  
  // Configure the build output for static hosting
  build: {
    // Place build output directly in dist rather than dist/public
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      // Specify the HTML entry point
      input: {
        main: path.resolve(__dirname, "client/index.html"),
      },
      output: {
        // Disable content hashing in filenames to avoid build ID conflicts
        // This helps prevent issues with GitHub Pages caching and deployment
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  
  // Include special file types to be processed as assets
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
  
  // Define environment variables and constants for the build
  define: {
    // Set a fixed app version to avoid build ID issues
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  }
});