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
};

type State = {
  hasError: boolean;
  recoveryMode: RecoveryOutcome | null;
};

class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, recoveryMode: null };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const recoveryMode = recoverFromDeployRuntimeError({
      source: "app-error-boundary",
      error,
      reason: "app-render-error",
    });

    if (recoveryMode !== "not-deploy-error") {
      this.setState({ recoveryMode });

      return;
    }

    reportClientError("app-error-boundary", error, {
      reason: "app-error-fallback",
    });
  }

  render() {
    const { recoveryMode } = this.state;
    const isDeployRecovery = recoveryMode === "manual-reload-required";

    if (this.state.hasError) {
      if (recoveryMode === "auto-reload-triggered") {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
              <h1 className="text-2xl font-semibold tracking-tight">
                {i18n.t("common.updatingApplication")}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {i18n.t("common.loadingLatestVersion")}
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-2xl font-semibold text-foreground">
              !
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isDeployRecovery
                ? i18n.t("common.newVersionAvailable")
                : i18n.t("somethingWentWrong")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isDeployRecovery
                ? i18n.t("common.deployReloadPrompt")
                : i18n.t("refreshPageMessage")}
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

export default AppErrorBoundary;
