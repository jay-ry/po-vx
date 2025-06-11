import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // Try to parse as JSON first (for API errors)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || res.statusText;
      } else {
        // If it's not JSON (likely HTML error page), just use status text
        const text = await res.text();
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          // It's an HTML page, probably a 404 or server error page
          errorMessage = `Server returned HTML page instead of JSON. Status: ${res.status} ${res.statusText}`;
        } else {
          errorMessage = text || res.statusText;
        }
      }
    } catch (parseError) {
      // If we can't parse the response, use the status text
      errorMessage = `${res.status} ${res.statusText}`;
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  contentType?: string | null,
  customHeaders?: Record<string, string> | null,
  isFormData: boolean = false,
): Promise<Response> {
  let headers: Record<string, string> = {};
  
  // If we're not sending FormData, set the content type
  if (data && !isFormData) {
    headers["Content-Type"] = contentType || "application/json";
  }
  
  // Add any custom headers
  if (customHeaders) {
    headers = { ...headers, ...customHeaders };
  }
  
  const res = await fetch(url, {
    method,
    headers,
    // For FormData, use the data as is, otherwise stringify
    body: data 
      ? isFormData 
        ? data as FormData 
        : JSON.stringify(data) 
      : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Check if the response is actually JSON before parsing
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
