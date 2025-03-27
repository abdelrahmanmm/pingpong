#!/bin/bash

# Check if gh-pages-build.js exists
if [ ! -f "gh-pages-build.js" ]; then
  echo "Error: gh-pages-build.js file not found!"
  exit 1
fi

# Build the site for GitHub Pages
echo "Building the site for GitHub Pages..."
node gh-pages-build.js

# Check if the build was successful
if [ ! -d "dist" ]; then
  echo "Error: Build failed! No dist directory found."
  exit 1
fi

echo "Build completed successfully. The site is ready to be deployed."
echo ""
echo "To deploy your site to GitHub Pages:"
echo ""
echo "1. Create a GitHub repository (if you haven't already)"
echo "2. Add your GitHub repository as a remote:"
echo "   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git"
echo ""
echo "3. Push your code to GitHub:"
echo "   git push -u origin main"
echo ""
echo "4. Deploy to GitHub Pages using gh-pages:"
echo "   npx gh-pages -d dist"
echo ""
echo "5. After deployment, your site will be available at:"
echo "   https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/"
echo ""
echo "Note: Make sure your GitHub repository has GitHub Pages enabled in the repository settings."