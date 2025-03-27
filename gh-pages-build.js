/**
 * GitHub Pages Build Script
 * 
 * This script prepares the application for deployment to GitHub Pages by:
 * 1. Building the client-side application with GitHub Pages-specific config
 * 2. Copying all static assets (sounds, textures, etc.) to the dist folder
 * 3. Creating a 404.html file for SPA routing support
 * 
 * This script is designed to be run as part of the deploy-to-github.sh workflow
 * and produces a purely client-side build that can be hosted on GitHub Pages.
 * 
 * @file gh-pages-build.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a pure client-side build configuration for GitHub Pages
console.log('Creating GitHub Pages build configuration...');

/**
 * Step 1: Build the client-side application
 * 
 * Uses the specialized vite.config.gh-pages.ts configuration which:
 * - Sets relative paths for assets
 * - Disables chunk hashing to prevent build ID issues
 * - Configures output for static hosting
 */
console.log('Building client app using GitHub Pages configuration...');
try {
  // Use GitHub Pages specific configuration
  execSync('npx vite build --config vite.config.gh-pages.ts', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed with error:', error.message);
  process.exit(1);
}

/**
 * Step 2: Set up distribution folder
 * This section ensures the dist folder is properly structured
 */
console.log('Setting up dist folder...');

/**
 * Step 3: Copy static assets to the distribution folder
 * 
 * This helper function recursively copies directories and their contents
 * from the source to the destination path, preserving the directory structure.
 * 
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Get all entries (files and directories) in the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy individual files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Asset directories to copy from public to dist
 * These directories contain static assets needed by the application:
 * - sounds: Game audio files (background music, hit sounds, etc.)
 * - textures: Image files for game graphics
 * - fonts: Custom font files
 * - geometries: 3D model files
 */
const assetDirs = ['sounds', 'textures', 'fonts', 'geometries'];

// Copy each asset directory if it exists
assetDirs.forEach(dir => {
  const srcDir = path.join(process.cwd(), 'client', 'public', dir);
  const destDir = path.join(process.cwd(), 'dist', dir);
  
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, destDir);
    console.log(`${dir} files copied to dist/${dir}`);
  }
});

/**
 * Step 4: Create a 404.html file for SPA routing support
 * 
 * GitHub Pages doesn't natively support client-side routing for SPAs.
 * This creates a 404.html page that redirects back to the main application
 * while preserving the route information, enabling client-side routing.
 * 
 * Based on the SPA GitHub Pages technique by Rafael Pedicini:
 * https://github.com/rafgraph/spa-github-pages
 */
const notFoundContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ping Pong Game</title>
  <script>
    // Single Page Apps for GitHub Pages
    // This script takes the current URL and converts the path and query string into
    // just a query string, and then redirects the browser to the new URL with
    // only a query string and hash fragment.
    (function(l) {
      if (l.search[1] === '/' ) {
        var decoded = l.search.slice(1).split('&').map(function(s) { 
          return s.replace(/~and~/g, '&')
        }).join('?');
        window.history.replaceState(null, null,
            l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location))
  </script>
  <!-- Redirect to the home page after the script runs -->
  <meta http-equiv="refresh" content="0;URL='/'">
</head>
<body>
  <p>Redirecting to home page...</p>
</body>
</html>
`;

// Write the 404.html file to the distribution directory
fs.writeFileSync(path.join(process.cwd(), 'dist', '404.html'), notFoundContent);

// Final success message
console.log('GitHub Pages build completed successfully!');