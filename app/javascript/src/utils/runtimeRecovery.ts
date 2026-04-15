const AUTO_RELOAD_MARKER_KEY = "miru:auto-reload-at";
const AUTO_RELOAD_COOLDOWN_MS = 2 * 60 * 1000;
const CLIENT_ERROR_EVENT = "miru:client-error";

const DEPLOY_ASSET_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /ChunkLoadError/i,
  /Loading chunk [\d]+ failed/i,
  /Unable to preload CSS/i,
  /preload.+failed/i,
];

let handlersInstalled = false;

type RecoveryOutcome =
  | "not-deploy-error"
  | "auto-reload-triggered"
  | "manual-reload-required";

type RecoveryInput = {
  source: string;
  error: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message || error.name;

  if (typeof error === "string") return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown runtime error";
  }
};

const getErrorName = (error: unknown): string => {
  if (error instanceof Error) return error.name || "Error";

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof (error as { name?: unknown }).name === "string"
  ) {
    return (error as { name: string }).name;
  }

  return "Error";
};

const getAutoReloadMarker = (): number | null => {
  try {
    const rawValue = window.sessionStorage.getItem(AUTO_RELOAD_MARKER_KEY);
    if (!rawValue) return null;

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
};

const canAutoReload = (): boolean => {
  const marker = getAutoReloadMarker();
  if (!marker) return true;

  return Date.now() - marker > AUTO_RELOAD_COOLDOWN_MS;
};

const markAutoReload = () => {
  try {
    window.sessionStorage.setItem(
      AUTO_RELOAD_MARKER_KEY,
      Date.now().toString()
    );
  } catch {
    // Ignore storage errors in private mode or restricted contexts.
  }
};

export const reportClientError = (
  source: string,
  error: unknown,
  metadata: Record<string, unknown> = {}
) => {
  const payload = {
    source,
    errorName: getErrorName(error),
    message: getErrorMessage(error),
    pathname: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.error(`[miru:${source}]`, payload);

  try {
    window.dispatchEvent(
      new CustomEvent(CLIENT_ERROR_EVENT, {
        detail: payload,
      })
    );
  } catch {
    // Ignore event dispatch failures.
  }
};

export const isDeployAssetError = (error: unknown): boolean => {
  const errorMessage = getErrorMessage(error);

  return DEPLOY_ASSET_ERROR_PATTERNS.some(pattern =>
    pattern.test(errorMessage)
  );
};

export const reloadApplication = () => {
  window.location.reload();
};

export const recoverFromDeployRuntimeError = ({
  source,
  error,
  reason = "runtime-deploy-asset-error",
  metadata = {},
}: RecoveryInput): RecoveryOutcome => {
  if (!isDeployAssetError(error)) return "not-deploy-error";

  if (canAutoReload()) {
    markAutoReload();
    reportClientError(source, error, {
      reason,
      recovery: "auto-reload",
      ...metadata,
    });
    reloadApplication();

    return "auto-reload-triggered";
  }

  reportClientError(source, error, {
    reason,
    recovery: "manual-reload-required",
    ...metadata,
  });

  return "manual-reload-required";
};

export const installRuntimeRecoveryHandlers = () => {
  if (handlersInstalled) return;
  handlersInstalled = true;

  window.addEventListener("unhandledrejection", event => {
    const outcome = recoverFromDeployRuntimeError({
      source: "global-unhandledrejection",
      error: event.reason,
      reason: "unhandled-rejection",
    });

    if (outcome !== "not-deploy-error") {
      event.preventDefault();
    }
  });

  window.addEventListener("vite:preloadError", event => {
    const preloadEvent = event as Event & { payload?: unknown };
    const outcome = recoverFromDeployRuntimeError({
      source: "vite-preload-error",
      error: preloadEvent.payload ?? event,
      reason: "vite-preload-error",
    });

    if (outcome !== "not-deploy-error") {
      event.preventDefault();
    }
  });
};

export type { RecoveryOutcome };
