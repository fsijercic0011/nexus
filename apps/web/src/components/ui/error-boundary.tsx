import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/error-state";

function Fallback() {
  return (
    <ErrorState
      message={"Something went wrong. Please try again later."}
      onRetry={() => window.location.reload()}
    />
  );
}

interface Props {
  children: ReactNode;
  resetKey?: string;
}
interface State {
  failed: boolean;
  resetKey?: string;
}

/** Catches render and lazy-chunk failures so a page never goes blank. A change
 * of `resetKey` (the pathname) clears a failure, so navigating away recovers
 * even where the page itself stays mounted. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    return props.resetKey === state.resetKey
      ? null
      : { failed: false, resetKey: props.resetKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
