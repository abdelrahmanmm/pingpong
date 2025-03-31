import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
 * Custom API request function
 * 
 * @param endpoint - API endpoint path or full URL
 * @param options - Request options (method, body, etc.)
 * @returns Response data as JSON
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
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
