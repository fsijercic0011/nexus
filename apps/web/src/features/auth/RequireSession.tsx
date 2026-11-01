import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ME_QUERY_KEY, useMe } from "@/hooks/useMe";
import { StorageUserContext } from "@/hooks/useStoredState";
import { onUnauthorized } from "@/lib/api";

/** Guards the app shell: signed-out visitors go to /sign-in (keeping where
 * they were going); a 401 from any later request does the same. */
export function RequireSession() {
  const me = useMe();
  const client = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    onUnauthorized(() => client.setQueryData(ME_QUERY_KEY, null));
    return () => onUnauthorized(null);
  }, [client]);

  if (me.isPending) return <LoadingState />;
  if (me.isError) {
    return (
      <ErrorState
        message="NEXUS can't reach the server. Please try again."
        onRetry={() => void me.refetch()}
      />
    );
  }
  if (!me.data) {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />
    );
  }
  return (
    <StorageUserContext.Provider value={me.data.user.id}>
      <AppLayout
        user={{ name: me.data.user.name, email: me.data.user.email }}
      />
    </StorageUserContext.Provider>
  );
}
