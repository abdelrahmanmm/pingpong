import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a pure client-side build configuration for GitHub Pages
console.log('Creating GitHub Pages build configuration...');

// 1. Build the client-side app
console.log('Building client app using GitHub Pages configuration...');
try {
  // Use our GitHub Pages specific configuration
  execSync('npx vite build --config vite.config.gh-pages.ts', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed with error:', error.message);
  process.exit(1);
}

// 2. Copy the index.html to the root of the dist folder
console.log('Setting up dist folder...');

// 3. Make sure all static assets are copied correctly
// Function to copy directory contents recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// List of asset directories to copy
const assetDirs = ['sounds', 'textures', 'fonts', 'geometries'];

// Copy each asset directory
assetDirs.forEach(dir => {
  const srcDir = path.join(process.cwd(), 'client', 'public', dir);
  const destDir = path.join(process.cwd(), 'dist', dir);
  
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, destDir);
    console.log(`${dir} files copied to dist/${dir}`);
  }
});

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