import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { localStorageService } from "./localStorageService";

/**
 * Helper function to throw an error for non-ok responses
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Attempt to parse error as JSON
      const errorData = await res.json();
      throw errorData;
    } catch (e) {
      // If JSON parsing fails, use status text
      const text = res.statusText || 'Unknown error';
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

/**
 * Determines if the app is running on GitHub Pages
 */
export const isGitHubPages = () => {
  return window.location.hostname.includes('github.io') || 
         import.meta.env.MODE === 'gh-pages';
};

/**
 * Custom API request function
 * 
 * This function will use local storage for data persistence when running on GitHub Pages,
 * and will use the server API when running normally.
 * 
 * @param endpoint - API endpoint path or full URL
 * @param options - Request options (method, body, etc.)
 * @returns Response data as JSON
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // If running on GitHub Pages, use local storage
  if (isGitHubPages()) {
    return handleGitHubPagesRequest(endpoint, options);
  }

  // Determine if the endpoint is a full URL or a relative path
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : endpoint;
  
  // Default headers
  const headers = {
    ...options.headers,
    ...(options.body ? { 'Content-Type': 'application/json' } : {})
  };
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for auth
  });
  
  // Check for error response
  if (!response.ok) {
    // Handle specific error status codes
    if (response.status === 401) {
      const error: any = new Response('Unauthorized');
      error.status = 401;
      throw error;
    }
    
    try {
      // Attempt to parse error as JSON
      const errorData = await response.json();
      throw errorData;
    } catch (e) {
      // If JSON parsing fails, throw response object
      throw response;
    }
  }
  
  // Parse success response as JSON
  return await response.json();
}

/**
 * Handles API requests for GitHub Pages using local storage
 */
async function handleGitHubPagesRequest(endpoint: string, options: RequestInit = {}) {
  // Parse request data if needed
  let requestData = {};
  if (options.body && typeof options.body === 'string') {
    try {
      requestData = JSON.parse(options.body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
    }
  }

  // Simulate network delay (optional, makes it feel more realistic)
  await new Promise(resolve => setTimeout(resolve, 300));

  // Normalize the endpoint by removing the /api prefix if present
  const normalizedEndpoint = endpoint.startsWith('/api') 
    ? endpoint.substring(4) 
    : endpoint;

  // Route requests to the appropriate local storage service functions
  if (normalizedEndpoint === '/auth/register' && options.method === 'POST') {
    const { username, email, password, displayName } = requestData as any;
    return localStorageService.register(username, email, password, displayName);
  }
  
  if (normalizedEndpoint === '/auth/login' && options.method === 'POST') {
    const { username, password } = requestData as any;
    return localStorageService.login(username, password);
  }
  
  if (normalizedEndpoint === '/auth/logout' && options.method === 'POST') {
    return localStorageService.logout();
  }
  
  if (normalizedEndpoint === '/auth/me' && (!options.method || options.method === 'GET')) {
    return localStorageService.getCurrentUser();
  }
  
  if (normalizedEndpoint === '/leaderboard' && (!options.method || options.method === 'GET')) {
    return localStorageService.getLeaderboard();
  }
  
  if (normalizedEndpoint === '/stats' && (!options.method || options.method === 'GET')) {
    return localStorageService.getUserStats();
  }
  
  if (normalizedEndpoint === '/stats/update' && options.method === 'POST') {
    return localStorageService.updateUserStats(requestData as any);
  }
  
  // Default fallback
  throw new Error(`Endpoint not implemented for GitHub Pages: ${normalizedEndpoint}`);
}

/**
 * Behavior options for unauthorized requests
 */
type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Query function factory for React Query
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    
    try {
      return await apiRequest(endpoint);
    } catch (error) {
      // Handle unauthorized based on configuration
      if (unauthorizedBehavior === "returnNull" && error instanceof Response && error.status === 401) {
        return null;
      }
      throw error;
    }
  };

/**
 * React Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
