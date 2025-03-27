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
 * 
 * @file gh-pages.tsx
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css"; // Import global styles
import { queryClient } from "./lib/queryClient";

/**
 * Main application renderer
 * 
 * Creates a React root and renders the application with necessary providers:
 * - React StrictMode: Helps catch potential problems in development
 * - QueryClientProvider: Provides React Query functionality for data fetching
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);