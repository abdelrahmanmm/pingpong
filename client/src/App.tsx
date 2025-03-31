import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements, Navigate } from "react-router-dom";
import PingPong from "./components/game/PingPong";
import { Toaster } from "./components/ui/toaster";
import "@fontsource/inter";
import { UserProfile } from "./components/auth/UserProfile";
import AuthPage from "./pages/auth";
import LeaderboardPage from "./pages/leaderboard";
import NotFound from "./pages/not-found";

// Create router with routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Home route (game) */}
      <Route 
        path="/" 
        element={
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <UserProfile />
            </div>
            <PingPong />
          </div>
        } 
      />
      
      {/* Authentication route */}
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Leaderboard route */}
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      
      {/* 404 Not Found */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </>
  )
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
