import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a pure client-side build configuration for GitHub Pages
console.log('Creating GitHub Pages build configuration...');

// 1. Build the client-side app
console.log('Building client app...');
execSync('npx vite build --base=./');

// 2. Copy the index.html to the root of the dist folder
console.log('Setting up dist folder...');

// 3. Make sure public/sounds are copied correctly
const soundsDir = path.join(process.cwd(), 'dist', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Copy sound files if they exist in public/sounds
const publicSoundsDir = path.join(process.cwd(), 'client', 'public', 'sounds');
if (fs.existsSync(publicSoundsDir)) {
  const soundFiles = fs.readdirSync(publicSoundsDir);
  soundFiles.forEach(file => {
    const srcPath = path.join(publicSoundsDir, file);
    const destPath = path.join(soundsDir, file);
    fs.copyFileSync(srcPath, destPath);
  });
  console.log('Sound files copied to dist/sounds');
}

// 4. Create a 404.html that redirects to index.html for SPA routing
const notFoundContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ping Pong Game</title>
  <script>
    // Single Page Apps for GitHub Pages
    // https://github.com/rafgraph/spa-github-pages
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
  <meta http-equiv="refresh" content="0;URL='/'">
</head>
<body>
  <p>Redirecting to home page...</p>
</body>
</html>
`;

fs.writeFileSync(path.join(process.cwd(), 'dist', '404.html'), notFoundContent);

console.log('GitHub Pages build completed successfully!');