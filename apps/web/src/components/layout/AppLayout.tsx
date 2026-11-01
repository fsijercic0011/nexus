import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingState } from "@/components/ui/loading-state";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export type ShellUser = { name: string; email: string };

/** The shared shell: the sidebar on desktop, the bottom bar on phones, and
 * the current page through Outlet. Each page opens with its own PageHeader. */
export function AppLayout({ user }: { user?: ShellUser }) {
  const phone = useIsMobile();
  const { pathname } = useLocation();
  return (
    <div className="isolate min-h-dvh text-foreground">
      <a
        href="#workspace-content"
        className="sr-only z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col md:flex-row">
        {!phone && <Sidebar user={user} />}
        <main
          id="workspace-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-10 md:pb-16"
        >
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      {phone && <BottomNav />}
    </div>
  );
}
