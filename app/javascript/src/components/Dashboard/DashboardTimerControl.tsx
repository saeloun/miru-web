import React, { useEffect, useMemo, useState } from "react";
import { Pause, Play, Stop, Timer } from "phosphor-react";
import { desktopCurrentTimerApi } from "apis/api";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";

interface CurrentTimer {
  billable: boolean;
  elapsed_ms: number;
  notes: string;
  project_name: string;
  running: boolean;
  started_at: string | null;
  task_name: string;
}

const DEFAULT_TIMER: CurrentTimer = {
  billable: false,
  elapsed_ms: 0,
  notes: "",
  project_name: "",
  running: false,
  started_at: null,
  task_name: "",
};

const formatElapsed = (elapsedMs: number) => {
  const seconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const currentElapsed = (timer: CurrentTimer, now = Date.now()) => {
  if (!timer.running || !timer.started_at) {
    return Math.max(timer.elapsed_ms || 0, 0);
  }

  const startedAt = Date.parse(timer.started_at);
  if (Number.isNaN(startedAt)) {
    return Math.max(timer.elapsed_ms || 0, 0);
  }

  return Math.max((timer.elapsed_ms || 0) + now - startedAt, 0);
};

const DashboardTimerControl = () => {
  const [timer, setTimer] = useState<CurrentTimer>(DEFAULT_TIMER);
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    desktopCurrentTimerApi
      .get()
      .then(response => {
        if (!isMounted) return;

        setTimer({
          ...DEFAULT_TIMER,
          ...(response.data?.current_timer || {}),
        });
      })
      .catch(() => {
        if (isMounted) setTimer(DEFAULT_TIMER);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!timer.running) return undefined;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [timer.running]);

  const elapsedMs = useMemo(() => currentElapsed(timer, now), [timer, now]);
  const hasElapsedTime = elapsedMs > 0;

  const syncTimer = async (nextTimer: CurrentTimer) => {
    setTimer(nextTimer);
    setIsUpdating(true);

    try {
      const response = await desktopCurrentTimerApi.update(nextTimer);
      setTimer({
        ...DEFAULT_TIMER,
        ...(response.data?.current_timer || nextTimer),
      });
    } catch {
      setTimer(timer);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = () => {
    if (timer.running) {
      syncTimer({
        ...timer,
        elapsed_ms: elapsedMs,
        running: false,
        started_at: null,
      });

      return;
    }

    syncTimer({
      ...timer,
      running: true,
      started_at: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    syncTimer({
      ...timer,
      elapsed_ms: 0,
      running: false,
      started_at: null,
    });
  };

  const timerLabel =
    timer.project_name || timer.task_name || timer.notes || t("timer.timer");

  const primaryAction = timer.running
    ? t("timer.pause")
    : hasElapsedTime
    ? t("timer.resume")
    : t("timer.start");

  return (
    <div
      className={cn(
        "hidden h-10 items-center gap-1 rounded-full border px-1.5 shadow-sm transition-colors sm:flex",
        timer.running
          ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          : hasElapsedTime
          ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          : "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
      )}
      data-testid="dashboard-timer-control"
    >
      <div className="flex min-w-0 items-center gap-2 pl-2 pr-1">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            timer.running
              ? "bg-emerald-600 text-white"
              : hasElapsedTime
              ? "bg-amber-500 text-white"
              : "bg-sky-600 text-white"
          )}
        >
          <Timer size={14} weight="fill" />
        </span>
        <div className="hidden min-w-0 flex-col leading-none md:flex">
          <span className="max-w-28 truncate text-xs font-semibold">
            {timerLabel}
          </span>
        </div>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {isLoading ? "--:--:--" : formatElapsed(elapsedMs)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading || isUpdating}
        aria-label={primaryAction}
        title={primaryAction}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60",
          timer.running
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-emerald-600 hover:bg-emerald-700"
        )}
      >
        {timer.running ? (
          <Pause size={14} weight="fill" />
        ) : (
          <Play size={14} weight="fill" />
        )}
      </button>

      {hasElapsedTime && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading || isUpdating}
          aria-label={t("timer.reset")}
          title={t("timer.reset")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-current transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10"
        >
          <Stop size={13} weight="fill" />
        </button>
      )}
    </div>
  );
};

export default DashboardTimerControl;
