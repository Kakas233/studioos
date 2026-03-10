import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes default
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler — individual onError callbacks override this
        console.error("Mutation error:", error);
      },
    },
  },
});
