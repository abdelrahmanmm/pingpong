/**
 * GitHub Pages Application Entry Point
 * 
 * This is a specialized entry point for the GitHub Pages deployment.
 * It differs from the main.tsx entry point in that it removes all
 * server-side dependencies and focuses solely on client-side functionality.
 * 
 * Key differences:
 * - No Express server integration
 * - No WebSocket connections
 * - Uses static assets only
 * - Works in the GitHub Pages environment
 * - Uses local storage for data persistence instead of a server
 * 
 * @file gh-pages.tsx
 */

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"; // Import global styles
import { queryClient } from "./lib/queryClient";
import { localStorageService } from "./lib/localStorageService";
import { isGitHubPages } from "./lib/queryClient";

/**
 * GitHubPagesProvider Component
 * 
 * This component initializes the demo data for GitHub Pages
 * when the application first loads.
 */
function GitHubPagesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize demo data when the app loads
    localStorageService.initializeDemoData();
    console.log("GitHub Pages mode: Demo data initialized");
  }, []);
  
  return <>{children}</>;
}

/**
 * Get repository name from URL for GitHub Pages
 * This is needed to set the correct basename for React Router
 */
function getRepoName(): string {
  if (isGitHubPages()) {
    // Get the repository name from the URL path
    // URL format is: username.github.io/repo-name
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length >= 2) {
      return '/' + pathSegments[1]; // First segment after domain
    }
  }
  return '/'; // Default to root for non-GitHub Pages environments
}

/**
 * Main application renderer
 * 
 * Creates a React root and renders the application with necessary providers:
 * - React StrictMode: Helps catch potential problems in development
 * - QueryClientProvider: Provides React Query functionality for data fetching
 * - BrowserRouter: Provides routing with correct basename for GitHub Pages
 * - GitHubPagesProvider: Initializes demo data for GitHub Pages
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={getRepoName()}>
        <GitHubPagesProvider>
          <App />
        </GitHubPagesProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);