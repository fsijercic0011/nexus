import { healthResponseSchema } from "@nexus/shared";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";

export function HealthStatus() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson("/api/health", healthResponseSchema),
  });

  let text = "Checking API…";
  if (health.isError) {
    text = "API unreachable";
  } else if (health.data) {
    text = `API: ok · Database: ${health.data.database}`;
  }

  return (
    <p role="status" className="text-sm text-muted-foreground">
      {text}
    </p>
  );
}
