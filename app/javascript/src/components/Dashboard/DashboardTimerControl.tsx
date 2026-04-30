import React, { useEffect, useMemo, useState } from "react";
import {
  CaretDown,
  Desktop,
  Pause,
  Play,
  Plus,
  Stop,
  Timer,
} from "phosphor-react";
import { desktopCurrentTimerApi } from "apis/api";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  createTimerState,
  currentTimerFromTimerDeck,
  defaultTimerState,
  emptyTimerDeck,
  formatTimerDuration,
  loadStoredTimerDeck,
  pauseRunningTimers,
  persistTimerDeck,
  shouldAdoptRemoteTimerDeck,
  timerDeckFromDesktopCurrentTimer,
  timerDeckHasWork,
  timerElapsedMs,
  timerHasWork,
  TIMER_SYNC_EVENT,
  type StoredTimerDeck,
  type StoredTimerState,
} from "utils/timeTrackingTimer";

const activeTimerFromDeck = (timerDeck: StoredTimerDeck) =>
  timerDeck.timers.find(
    currentTimer => currentTimer.id === timerDeck.activeTimerId
  ) ||
  timerDeck.timers[0] ||
  defaultTimerState();

const DashboardTimerControl = () => {
  const [timerDeck, setTimerDeck] = useState<StoredTimerDeck>(() =>
    loadStoredTimerDeck()
  );
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const timer = useMemo(() => activeTimerFromDeck(timerDeck), [timerDeck]);
  const elapsedMs = useMemo(() => timerElapsedMs(timer, now), [timer, now]);
  const hasElapsedTime = elapsedMs > 0;
  const hasRunningTimer = timerDeck.timers.some(
    currentTimer => currentTimer.isRunning
  );
  const hasSharedWork = timerDeckHasWork(timerDeck);

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
    if (!hasRunningTimer) return undefined;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [hasRunningTimer]);

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

  const timerLabel = (timerState: StoredTimerState) =>
    timerState.project || timerState.description || t("timer.untitledTimer");

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
    if (timerDeck.timers.length <= 1) {
      syncTimerDeck(emptyTimerDeck());

      return;
    }

    const remainingTimers = timerDeck.timers.filter(
      currentTimer => currentTimer.id !== timerDeck.activeTimerId
    );
    const nextActiveTimer = remainingTimers[0] || defaultTimerState();

    syncTimerDeck({
      activeTimerId: nextActiveTimer.id,
      timers: remainingTimers.length ? remainingTimers : [nextActiveTimer],
      version: timerDeck.version,
    });
  };

  const handleAddTimer = () => {
    const startedAt = Date.now();
    const nextTimer = {
      ...createTimerState(),
      isRunning: true,
      startTime: startedAt,
    };

    syncTimerDeck({
      activeTimerId: nextTimer.id,
      timers: [
        ...pauseRunningTimers(timerDeck.timers.filter(timerHasWork), startedAt),
        nextTimer,
      ],
      version: timerDeck.version,
    });
  };

  const handleSwitchTimer = (timerId: string) => {
    const switchedAt = Date.now();

    syncTimerDeck({
      activeTimerId: timerId,
      timers: pauseRunningTimers(timerDeck.timers, switchedAt, timerId).map(
        currentTimer =>
          currentTimer.id === timerId
            ? {
                ...currentTimer,
                elapsedTime: timerElapsedMs(currentTimer, switchedAt),
                isRunning: true,
                startTime:
                  switchedAt - timerElapsedMs(currentTimer, switchedAt),
              }
            : currentTimer
      ),
      version: timerDeck.version,
    });
  };

  const primaryAction = timer.isRunning
    ? t("timer.pause")
    : hasElapsedTime
    ? t("timer.resume")
    : t("timer.start");

  return (
    <Popover>
      <div
        className={cn(
          "hidden h-10 items-center gap-1 rounded-full border px-1.5 shadow-sm transition-colors sm:flex",
          timer.isRunning
            ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
            : hasElapsedTime || hasSharedWork
            ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            : "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
        )}
        data-testid="dashboard-timer-control"
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-2 pr-1 text-left transition hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={t("timer.timerDeck")}
            data-testid="dashboard-timer-menu"
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                timer.isRunning
                  ? "bg-emerald-600 text-white"
                  : hasElapsedTime || hasSharedWork
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
                {timerLabel(timer)}
              </span>
              {timerDeck.timers.length > 1 && (
                <span className="text-[10px] font-medium opacity-70">
                  {t("timer.activeTimers", { count: timerDeck.timers.length })}
                </span>
              )}
            </div>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {isLoading ? "--:--:--" : formatTimerDuration(elapsedMs)}
            </span>
            <CaretDown size={12} className="opacity-70" />
          </button>
        </PopoverTrigger>

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

        {(hasElapsedTime || timerDeck.timers.length > 1) && (
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

      <PopoverContent
        align="end"
        className="w-80 overflow-hidden p-0"
        data-testid="dashboard-timer-popover"
      >
        <div className="border-b border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
                <Desktop size={16} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {t("timer.timerDeck")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {hasSharedWork
                    ? t("timer.sharedWithDesktop")
                    : t("timer.localTimer")}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
                hasRunningTimer
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
              )}
            >
              {t("timer.activeTimers", { count: timerDeck.timers.length })}
            </span>
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto p-2">
          {timerDeck.timers.map(currentTimer => {
            const isActive = currentTimer.id === timerDeck.activeTimerId;
            const isRunning = currentTimer.isRunning;
            const currentElapsed = timerElapsedMs(currentTimer, now);

            return (
              <button
                key={currentTimer.id}
                type="button"
                aria-pressed={isActive}
                aria-label={`${t("timer.switchTimer")}: ${timerLabel(
                  currentTimer
                )}`}
                data-testid="dashboard-timer-option"
                onClick={() => handleSwitchTimer(currentTimer.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition",
                  isActive
                    ? "border-sky-300 bg-sky-50 text-sky-950 shadow-sm dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        isRunning ? "bg-emerald-500" : "bg-muted-foreground/40"
                      )}
                    />
                    <span className="truncate">{timerLabel(currentTimer)}</span>
                  </span>
                  {currentTimer.client && (
                    <span className="mt-0.5 block truncate pl-4 text-xs text-muted-foreground">
                      {currentTimer.client}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                  {formatTimerDuration(currentElapsed)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleAddTimer}
            disabled={isLoading || isUpdating}
            data-testid="dashboard-timer-new"
          >
            <Plus size={14} className="mr-1" />
            {t("timer.newTimer")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={handleToggle}
            disabled={isLoading || isUpdating}
          >
            {timer.isRunning ? (
              <Pause size={14} className="mr-1" weight="fill" />
            ) : (
              <Play size={14} className="mr-1" weight="fill" />
            )}
            {primaryAction}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DashboardTimerControl;
