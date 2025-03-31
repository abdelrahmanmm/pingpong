import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { apiRequest } from '../lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

type LeaderboardEntry = {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  gamesPlayed: number;
  gamesWon: number;
  highScore: number;
  lastPlayed: string;
};

export default function LeaderboardPage() {
  // Fetch leaderboard data
  const { data, isLoading, isError } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const data = await apiRequest('/api/leaderboard');
      return data.leaderboard;
    },
  });

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            Top players ranked by highest score
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to Game</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
          <CardDescription>
            Compete with other players and climb the ranks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="ml-auto space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            // Error state
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Failed to load leaderboard data</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : data && data.length > 0 ? (
            // Data loaded successfully
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">High Score</TableHead>
                  <TableHead className="text-right">Games Won</TableHead>
                  <TableHead className="text-right">Games Played</TableHead>
                  <TableHead className="text-right">Last Played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${entry.username}`} />
                          <AvatarFallback>
                            {entry.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {entry.displayName || entry.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{entry.highScore}</TableCell>
                    <TableCell className="text-right">{entry.gamesWon}</TableCell>
                    <TableCell className="text-right">{entry.gamesPlayed}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.lastPlayed), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            // No data
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No leaderboard data available yet. Be the first to play!
              </p>
              <Button asChild>
                <Link to="/">Play Game</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}