import React, { useEffect, useMemo, useState } from "react";
import { Desktop, Pause, Play, Stop, Timer } from "phosphor-react";
import { desktopCurrentTimerApi } from "apis/api";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import {
  currentTimerFromTimerDeck,
  defaultTimerState,
  emptyTimerDeck,
  formatTimerDuration,
  loadStoredTimerDeck,
  pauseRunningTimers,
  persistTimerDeck,
  shouldAdoptRemoteTimerDeck,
  timerDeckFromDesktopCurrentTimer,
  timerElapsedMs,
  TIMER_SYNC_EVENT,
  type StoredTimerDeck,
} from "utils/timeTrackingTimer";

const DashboardTimerControl = () => {
  const [timerDeck, setTimerDeck] = useState<StoredTimerDeck>(() =>
    loadStoredTimerDeck()
  );
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const timer = useMemo(
    () =>
      timerDeck.timers.find(
        currentTimer => currentTimer.id === timerDeck.activeTimerId
      ) ||
      timerDeck.timers[0] ||
      defaultTimerState(),
    [timerDeck]
  );

  useEffect(() => {
    let isMounted = true;

    desktopCurrentTimerApi
      .get()
      .then(response => {
        if (!isMounted) return;

        const localDeck = loadStoredTimerDeck();
        const remoteDeck = timerDeckFromDesktopCurrentTimer(
          response.data?.current_timer
        );

        setTimerDeck(
          shouldAdoptRemoteTimerDeck(remoteDeck, localDeck)
            ? remoteDeck
            : localDeck
        );
      })
      .catch(() => {
        if (isMounted) setTimerDeck(loadStoredTimerDeck());
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncFromStorage = () => setTimerDeck(loadStoredTimerDeck());

    window.addEventListener(TIMER_SYNC_EVENT, syncFromStorage);

    return () => window.removeEventListener(TIMER_SYNC_EVENT, syncFromStorage);
  }, []);

  useEffect(() => {
    if (!timer.isRunning) return undefined;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [timer.isRunning]);

  const elapsedMs = useMemo(() => timerElapsedMs(timer, now), [timer, now]);
  const hasElapsedTime = elapsedMs > 0;

  const syncTimerDeck = async (nextTimerDeck: StoredTimerDeck) => {
    setTimerDeck(nextTimerDeck);
    persistTimerDeck(nextTimerDeck);
    setIsUpdating(true);

    try {
      const response = await desktopCurrentTimerApi.update(
        currentTimerFromTimerDeck(nextTimerDeck)
      );

      const remoteDeck = timerDeckFromDesktopCurrentTimer(
        response.data?.current_timer
      );
      setTimerDeck(remoteDeck);
      persistTimerDeck(remoteDeck);
    } catch {
      setTimerDeck(loadStoredTimerDeck());
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = () => {
    if (timer.isRunning) {
      syncTimerDeck({
        ...timerDeck,
        timers: timerDeck.timers.map(currentTimer =>
          currentTimer.id === timerDeck.activeTimerId
            ? {
                ...currentTimer,
                elapsedTime: elapsedMs,
                isRunning: false,
                startTime: null,
              }
            : currentTimer
        ),
      });

      return;
    }

    syncTimerDeck({
      ...timerDeck,
      timers: pauseRunningTimers(
        timerDeck.timers,
        now,
        timerDeck.activeTimerId
      ).map(currentTimer =>
        currentTimer.id === timerDeck.activeTimerId
          ? {
              ...currentTimer,
              elapsedTime: timerElapsedMs(currentTimer, now),
              isRunning: true,
              startTime: now - timerElapsedMs(currentTimer, now),
            }
          : currentTimer
      ),
    });
  };

  const handleReset = () => {
    syncTimerDeck({
      ...emptyTimerDeck(),
    });
  };

  const timerLabel = timer.project || timer.description || t("timer.timer");

  const primaryAction = timer.isRunning
    ? t("timer.pause")
    : hasElapsedTime
    ? t("timer.resume")
    : t("timer.start");

  return (
    <div
      className={cn(
        "hidden h-10 items-center gap-1 rounded-full border px-1.5 shadow-sm transition-colors sm:flex",
        timer.isRunning
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
            timer.isRunning
              ? "bg-emerald-600 text-white"
              : hasElapsedTime
              ? "bg-amber-500 text-white"
              : "bg-sky-600 text-white"
          )}
        >
          {timerDeck.timers.length > 1 ? (
            <Desktop size={14} weight="duotone" />
          ) : (
            <Timer size={14} weight="fill" />
          )}
        </span>
        <div className="hidden min-w-0 flex-col leading-none md:flex">
          <span className="max-w-28 truncate text-xs font-semibold">
            {timerLabel}
          </span>
        </div>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {isLoading ? "--:--:--" : formatTimerDuration(elapsedMs)}
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
          timer.isRunning
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-emerald-600 hover:bg-emerald-700"
        )}
      >
        {timer.isRunning ? (
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
