#!/bin/bash

# Set strict error handling
set -e

# Check if gh-pages-build.js exists
if [ ! -f "gh-pages-build.js" ]; then
  echo "Error: gh-pages-build.js file not found!"
  exit 1
fi

# Check if gh-pages package is installed
if ! npx --no-install gh-pages --version &> /dev/null; then
  echo "Installing gh-pages package..."
  npm install --save-dev gh-pages
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

# Ask if the user wants to proceed with deployment
read -p "Do you want to deploy to GitHub Pages now? (y/n): " choice
case "$choice" in 
  y|Y ) 
    # Ask for GitHub repository details
    read -p "Enter your GitHub username: " username
    read -p "Enter your repository name: " repo_name
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
      echo "Initializing git repository..."
      git init
      git add .
      git commit -m "Initial commit"
    fi
    
    # Check if the origin remote exists
    if ! git remote | grep -q "^origin$"; then
      echo "Adding GitHub remote..."
      echo "For authentication, you'll need a Personal Access Token with 'repo' scope."
      read -p "Enter your GitHub Personal Access Token (or press Enter to skip): " token
      
      if [ -n "$token" ]; then
        git remote add origin "https://${username}:${token}@github.com/${username}/${repo_name}.git"
      else
        git remote add origin "https://github.com/${username}/${repo_name}.git"
        echo "Remote added without token. You may be prompted for credentials during push."
      fi
    fi
    
    echo "Deploying to GitHub Pages..."
    npx gh-pages -d dist
    
    echo ""
    echo "Deployment complete! Your site will be available at:"
    echo "https://${username}.github.io/${repo_name}/"
    echo ""
    echo "Note: It may take a few minutes for your site to appear. Make sure GitHub Pages is enabled in your repository settings."
    ;;
  * ) 
    echo ""
    echo "Manual deployment instructions:"
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
    ;;
esac