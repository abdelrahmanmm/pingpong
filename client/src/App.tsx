import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import PingPong from "./components/game/PingPong";
import "@fontsource/inter";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full flex items-center justify-center bg-background overflow-hidden">
        <PingPong />
      </div>
    </QueryClientProvider>
  );
}

export default App;
