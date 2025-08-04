// ReactQueryProvider.tsx
"use client"; // This ensures the component is a Client Component
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Initialize QueryClient in a client-only state hook.
  const [queryClient] = useState(() => new QueryClient());
  
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
