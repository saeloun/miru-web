import React from "react";

import {
  recoverFromDeployRuntimeError,
  reloadApplication,
  reportClientError,
  type RecoveryOutcome,
} from "utils/runtimeRecovery";

type Props = {
  children: React.ReactNode;
  resetKey?: string;
};

type State = {
  hasError: boolean;
  recoveryMode: RecoveryOutcome | null;
};

class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, recoveryMode: null };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const recoveryMode = recoverFromDeployRuntimeError({
      source: "route-error-boundary",
      error,
      reason: "route-render-error",
    });

    if (recoveryMode !== "not-deploy-error") {
      this.setState({ recoveryMode });

      return;
    }

    reportClientError("route-error-boundary", error, {
      reason: "route-error-fallback",
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, recoveryMode: null });
    }
  }

  render() {
    const { recoveryMode } = this.state;

    if (this.state.hasError) {
      if (recoveryMode === "auto-reload-triggered") {
        return (
          <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-muted-foreground">
            Loading latest version...
          </div>
        );
      }

      const isDeployRecovery = recoveryMode === "manual-reload-required";

      return (
        <div className="flex min-h-[40vh] items-center justify-center px-6 py-8">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {isDeployRecovery
                ? "A new version is available"
                : "Something went wrong"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isDeployRecovery
                ? "We could not load the latest app files automatically. Refresh once to continue with the updated build."
                : "This page failed to load. Refresh and try again."}
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              onClick={reloadApplication}
              type="button"
            >
              {isDeployRecovery ? "Reload application" : "Reload page"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
