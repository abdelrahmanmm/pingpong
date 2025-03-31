import { AuthForms } from '../components/auth/AuthForms';

export default function AuthPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Ping Pong Game</h1>
          <p className="text-muted-foreground mt-2">
            Login or create an account to track your stats and join the leaderboard
          </p>
        </div>
        
        <AuthForms />
        
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-sm text-muted-foreground hover:underline"
          >
            Return to Game
          </a>
        </div>
      </div>
    </div>
  );
}