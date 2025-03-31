#!/bin/bash
#
# GitHub Pages Deployment Script
#
# This script automates the process of deploying the ping pong game to GitHub Pages:
# 1. Builds the application using the GitHub Pages-specific configuration
# 2. Deploys the built application to the gh-pages branch of a GitHub repository
# 3. Provides interactive prompts for authentication and repository configuration
#
# Requirements:
# - Node.js and npm must be installed
# - Git must be installed
# - GitHub account with permission to push to the target repository
#
# Usage: 
#   ./deploy-to-github.sh
#   (Follow the interactive prompts to complete deployment)
#

# Set strict error handling (script will exit if any command fails)
set -e

# Check if the GitHub Pages build script exists
if [ ! -f "gh-pages-build.js" ]; then
  echo "Error: gh-pages-build.js file not found!"
  echo "This file is required to build the application for GitHub Pages deployment."
  exit 1
fi

# Check if the gh-pages npm package is installed (required for deployment)
# The gh-pages package handles the creation and pushing to the gh-pages branch
if ! npx --no-install gh-pages --version &> /dev/null; then
  echo "Installing gh-pages package..."
  npm install --save-dev gh-pages
fi

# Execute the GitHub Pages build script
echo "Building the site for GitHub Pages..."
node gh-pages-build.js

# Verify the build was successful by checking for the dist directory
if [ ! -d "dist" ]; then
  echo "Error: Build failed! No dist directory found."
  echo "Check the build output above for errors."
  exit 1
fi

echo "Build completed successfully. The site is ready to be deployed."
echo ""

# Interactive prompt for deployment
read -p "Do you want to deploy to GitHub Pages now? (y/n): " choice
case "$choice" in 
  y|Y ) 
    # Collect GitHub repository information
    read -p "Enter your GitHub username: " username
    read -p "Enter your repository name: " repo_name
    
    # Initialize git repository if needed
    if [ ! -d ".git" ]; then
      echo "Initializing git repository..."
      git init
      git add .
      git commit -m "Initial commit"
    fi
    
    # Configure the remote repository connection
    if ! git remote | grep -q "^origin$"; then
      echo "Adding GitHub remote..."
      echo "For authentication, you'll need a Personal Access Token with 'repo' scope."
      echo "This token allows the script to push to your repository."
      read -p "Enter your GitHub Personal Access Token (or press Enter to skip): " token
      
      # Set up remote with or without token authentication
      if [ -n "$token" ]; then
        # Use token for authentication (more secure for CI/CD environments)
        git remote add origin "https://${username}:${token}@github.com/${username}/${repo_name}.git"
      else
        # Use standard HTTPS remote (will prompt for credentials later)
        git remote add origin "https://github.com/${username}/${repo_name}.git"
        echo "Remote added without token. You may be prompted for credentials during push."
      fi
    fi
    
    # Deploy to GitHub Pages using the gh-pages npm package
    # This creates or updates the gh-pages branch with the contents of the dist directory
    echo "Deploying to GitHub Pages..."
    npx gh-pages -d dist
    
    # Provide deployment success information and URL
    echo ""
    echo "Deployment complete! Your site will be available at:"
    echo "https://${username}.github.io/${repo_name}/"
    echo ""
    echo "Note: It may take a few minutes for your site to appear. Make sure GitHub Pages is enabled in your repository settings."
    echo "To enable GitHub Pages, go to: https://github.com/${username}/${repo_name}/settings/pages"
    echo "and set the source to 'Deploy from a branch' with 'gh-pages' as the branch."
    ;;
  * ) 
    # Manual instructions if user chooses not to deploy automatically
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
    echo "6. Enable GitHub Pages in your repository settings:"
    echo "   Go to Settings > Pages"
    echo "   Set source to 'Deploy from a branch'"
    echo "   Select 'gh-pages' branch and '/ (root)' folder"
    echo "   Click Save"
    ;;
esac