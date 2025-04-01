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
  // Create temporary build command that modifies the index.html to use gh-pages.tsx instead of main.tsx
  console.log('Preparing GitHub Pages entry point...');
  
  // Create a temporary index.html file that points to gh-pages.tsx
  const indexHtmlPath = path.join(process.cwd(), 'client', 'index.html');
  const originalIndexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Replace main.tsx with gh-pages.tsx in the script tag
  const ghPagesIndexHtml = originalIndexHtml.replace(
    /src="\.\/src\/main\.tsx"/,
    'src="./src/gh-pages.tsx"'
  );
  
  // Create a temporary backup of the original index.html
  const backupIndexHtmlPath = path.join(process.cwd(), 'client', 'index.html.bak');
  fs.writeFileSync(backupIndexHtmlPath, originalIndexHtml);
  
  // Write the modified index.html
  fs.writeFileSync(indexHtmlPath, ghPagesIndexHtml);
  
  // Now build with the modified index.html
  console.log('Building with GitHub Pages entry point...');
  execSync('npx vite build --config vite.config.gh-pages.ts', { stdio: 'inherit' });
  
  // Restore the original index.html
  fs.copyFileSync(backupIndexHtmlPath, indexHtmlPath);
  fs.unlinkSync(backupIndexHtmlPath);
  
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed with error:', error.message);
  
  // Clean up in case of error
  const indexHtmlPath = path.join(process.cwd(), 'client', 'index.html');
  const backupIndexHtmlPath = path.join(process.cwd(), 'client', 'index.html.bak');
  
  if (fs.existsSync(backupIndexHtmlPath)) {
    fs.copyFileSync(backupIndexHtmlPath, indexHtmlPath);
    fs.unlinkSync(backupIndexHtmlPath);
  }
  
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
    // Segment to handle GitHub Pages SPA routing
    // Extracts the repo name for proper path handling
    var pathSegmentsToKeep = 1; // Number of path segments to keep (1 for the repo name)
    
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body>
  <p>Redirecting to home page...</p>
</body>
</html>
`;

// Create a special index.html that handles the GitHub Pages SPA routing
const indexRedirectScript = `
  <!-- Start GitHub Pages SPA Routing Handler -->
  <script type="text/javascript">
    // This script checks to see if a redirect is present in the URL query
    // and converts it back into the correct URL if found
    (function(l) {
      if (l.search[1] === '/') {
        var decoded = l.search.slice(1).split('&')[0].split('=')[0].replace(/~and~/g, '&');
        window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location))
  </script>
  <!-- End GitHub Pages SPA Routing Handler -->
`;

// Add the redirect script to the index.html file
const indexHtmlPath = path.join(process.cwd(), 'dist', 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  // Insert the script right before the closing </head> tag
  indexHtml = indexHtml.replace('</head>', indexRedirectScript + '</head>');
  
  // Also update all asset references to use relative paths
  indexHtml = indexHtml.replace(/href="\//g, 'href="./');
  indexHtml = indexHtml.replace(/src="\//g, 'src="./');
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('Added SPA routing script to index.html and updated asset paths');
}

// Write the 404.html file to the distribution directory
fs.writeFileSync(path.join(process.cwd(), 'dist', '404.html'), notFoundContent);

// Final success message
console.log('GitHub Pages build completed successfully!');