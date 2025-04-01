/**
 * Asset Utilities for GitHub Pages
 * 
 * These utilities help correctly resolve asset paths when deployed to GitHub Pages
 */

import { isGitHubPages, getGitHubPagesBase } from './queryClient';

/**
 * Get the correct public asset URL for the current environment
 * 
 * @param path - Asset path (should start with a slash)
 * @returns Correctly formatted asset URL
 */
export function getAssetUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // If we're on GitHub Pages, prefix with the repository name
  if (isGitHubPages()) {
    // Remove the leading slash since getGitHubPagesBase already includes it
    const assetPath = path.startsWith('/') ? path.substring(1) : path;
    return getGitHubPagesBase() + assetPath;
  }
  
  // For development or regular deployment, return as is
  return path;
}

/**
 * Get correct URL for a sound asset
 * 
 * @param filename - Sound filename
 * @returns Full path to the sound file
 */
export function getSoundUrl(filename: string): string {
  return getAssetUrl(`sounds/${filename}`);
}

/**
 * Get correct URL for a texture/image asset
 * 
 * @param filename - Texture filename
 * @returns Full path to the texture file
 */
export function getTextureUrl(filename: string): string {
  return getAssetUrl(`textures/${filename}`);
}

/**
 * Get correct URL for a 3D model asset
 * 
 * @param filename - 3D model filename
 * @returns Full path to the 3D model file
 */
export function getModelUrl(filename: string): string {
  return getAssetUrl(`geometries/${filename}`);
}