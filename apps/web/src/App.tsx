import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthStatus } from "./features/health/HealthStatus";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-2 px-4 py-8">
        <h1 className="text-2xl font-semibold">NEXUS</h1>
        <HealthStatus />
      </main>
    </QueryClientProvider>
  );
}
