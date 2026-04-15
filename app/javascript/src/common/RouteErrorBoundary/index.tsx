import React from "react";
import { i18n } from "../../i18n";

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
    const isDeployRecovery = recoveryMode === "manual-reload-required";

    if (this.state.hasError) {
      if (recoveryMode === "auto-reload-triggered") {
        return (
          <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-muted-foreground">
            {i18n.t("common.loadingLatestVersion")}
          </div>
        );
      }

      return (
        <div className="flex min-h-[40vh] items-center justify-center px-6 py-8">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {isDeployRecovery
                ? i18n.t("common.newVersionAvailable")
                : i18n.t("somethingWentWrong")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isDeployRecovery
                ? i18n.t("common.deployReloadPrompt")
                : i18n.t("common.pageLoadFailedRefresh")}
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              onClick={reloadApplication}
              type="button"
            >
              {isDeployRecovery
                ? i18n.t("common.reloadApplication")
                : i18n.t("reloadPage")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
