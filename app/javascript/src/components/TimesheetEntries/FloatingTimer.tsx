import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Play,
  Pause,
  Stop,
  X,
  Timer,
  CaretDown,
  CaretUp,
  Plus,
  Desktop,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useUserContext } from "../../context/UserContext";
import { i18n } from "../../i18n";
import { desktopCurrentTimerApi, timesheetEntryApi } from "apis/api";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  createTimerState,
  currentTimerFromTimerDeck,
  loadStoredTimerDeck,
  persistTimerDeck,
  defaultTimerState,
  TIMER_DECK_VERSION,
  emptyTimerDeck,
  formatTimerDuration,
  pauseRunningTimers,
  shouldAdoptRemoteTimerDeck,
  timerDeckFromDesktopCurrentTimer,
  timerDeckHasWork,
  timerElapsedMs,
  type StoredTimerDeck,
  type StoredTimerState,
} from "utils/timeTrackingTimer";

interface FloatingTimerProps {
  onSaveEntry?: (entry: any) => void;
  placement?: "floating" | "inline";
  externalSyncKey?: number;
  resumeFromEntry?: {
    client: string;
    project: string;
    projectId: number;
    description?: string;
    resumeAt: number;
  } | null;
}

type TimerState = StoredTimerState;
type TimerDeck = StoredTimerDeck;

// Timer decks must always have at least one timer and a valid active timer id.
const ensureTimerDeck = (deck: TimerDeck | null | undefined): TimerDeck => {
  if (deck?.version !== TIMER_DECK_VERSION || !deck.timers?.length) {
    return emptyTimerDeck();
  }

  const activeTimerId = deck.timers.some(
    timer => timer.id === deck.activeTimerId
  )
    ? deck.activeTimerId
    : deck.timers[0].id;

  return activeTimerId === deck.activeTimerId
    ? deck
    : { ...deck, activeTimerId };
};

const FloatingTimer: React.FC<FloatingTimerProps> = ({
  onSaveEntry,
  placement = "floating",
  externalSyncKey = 0,
  resumeFromEntry = null,
}) => {
  const { user, company } = useUserContext();
  const queryClient = useQueryClient();
  const isInline = placement === "inline";

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasLoadedDesktopTimer, setHasLoadedDesktopTimer] = useState(false);
  const [isDesktopSynced, setIsDesktopSynced] = useState(false);
  const [timerDeck, setTimerDeck] = useState<TimerDeck>(() =>
    ensureTimerDeck(loadStoredTimerDeck())
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const desktopSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedTimerDeckRef = useRef(false);
  const latestTimerDeckRef = useRef(timerDeck);
  const timer = useMemo(
    () =>
      timerDeck.timers.find(
        currentTimer => currentTimer.id === timerDeck.activeTimerId
      ) ||
      timerDeck.timers[0] ||
      defaultTimerState(),
    [timerDeck]
  );

  // Fetch projects and clients from API
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const projectsResponse = await axios.get("/api/v1/projects");
        const projects = projectsResponse.data.projects || [];
        const clients = projectsResponse.data.clients || [];

        return {
          clients: clients.map(client => ({
            id: client.id,
            name: client.name,
          })),
          projects: projects.map(project => ({
            id: project.id,
            name: project.name,
            client: project.client_name || "No Client",
            clientId: project.client_id || null,
            billable: project.billable || false,
          })),
        };
      } catch (error) {
        console.error("Error fetching projects data:", error);

        return { clients: [], projects: [] };
      }
    },
  });

  const updateActiveTimer = (
    updater: (timerState: TimerState) => TimerState
  ) => {
    setTimerDeck(prev => ({
      ...prev,
      timers: prev.timers.map(currentTimer =>
        currentTimer.id === prev.activeTimerId
          ? updater(currentTimer)
          : currentTimer
      ),
    }));
  };

  useEffect(() => {
    latestTimerDeckRef.current = timerDeck;
  }, [timerDeck]);

  useEffect(() => {
    if (!hasMountedTimerDeckRef.current) {
      hasMountedTimerDeckRef.current = true;

      return;
    }

    persistTimerDeck(timerDeck);
  }, [timerDeck]);

  useEffect(() => {
    let isMounted = true;

    desktopCurrentTimerApi
      .get()
      .then(response => {
        if (!isMounted) return;

        const remoteDeck = ensureTimerDeck(
          timerDeckFromDesktopCurrentTimer(response.data?.current_timer)
        );

        setTimerDeck(currentDeck => {
          const localDeck = ensureTimerDeck(currentDeck);

          return shouldAdoptRemoteTimerDeck(remoteDeck, localDeck)
            ? remoteDeck
            : localDeck;
        });
        setIsDesktopSynced(timerDeckHasWork(remoteDeck));
      })
      .catch(() => {
        if (isMounted) setIsDesktopSynced(false);
      })
      .finally(() => {
        if (isMounted) setHasLoadedDesktopTimer(true);
      });

    return () => {
      isMounted = false;
    };
  }, [company?.id, user?.id]);

  useEffect(() => {
    if (!hasLoadedDesktopTimer) return;

    if (desktopSyncRef.current) return;

    const hasRunningTimer = timerDeck.timers.some(
      currentTimer => currentTimer.isRunning
    );
    const delay = hasRunningTimer ? 10_000 : 600;

    desktopSyncRef.current = setTimeout(() => {
      const deck = latestTimerDeckRef.current;
      desktopSyncRef.current = null;

      desktopCurrentTimerApi
        .update(currentTimerFromTimerDeck(deck))
        .then(() => setIsDesktopSynced(timerDeckHasWork(deck)))
        .catch(() => setIsDesktopSynced(false));
    }, delay);

    return () => {
      if (!hasRunningTimer && desktopSyncRef.current) {
        clearTimeout(desktopSyncRef.current);
        desktopSyncRef.current = null;
      }
    };
  }, [timerDeck, hasLoadedDesktopTimer]);

  useEffect(() => {
    setTimerDeck(ensureTimerDeck(loadStoredTimerDeck()));
  }, [externalSyncKey]);

  useEffect(() => {
    if (!resumeFromEntry) return;

    setTimerDeck(prev => {
      const existingTimer = prev.timers.find(
        currentTimer =>
          currentTimer.projectId === resumeFromEntry.projectId &&
          currentTimer.project === resumeFromEntry.project &&
          currentTimer.description === (resumeFromEntry.description || "") &&
          currentTimer.startTime &&
          Math.abs(currentTimer.startTime - resumeFromEntry.resumeAt) < 5000
      );

      const resumedTimer = {
        ...(existingTimer || createTimerState()),
        isRunning: true,
        startTime: resumeFromEntry.resumeAt,
        client: resumeFromEntry.client,
        project: resumeFromEntry.project,
        description: resumeFromEntry.description || "",
        projectId: resumeFromEntry.projectId,
      };

      const pausedTimers = pauseRunningTimers(
        prev.timers,
        resumeFromEntry.resumeAt,
        resumedTimer.id
      );

      return {
        activeTimerId: resumedTimer.id,
        timers: existingTimer
          ? pausedTimers.map(currentTimer =>
              currentTimer.id === resumedTimer.id ? resumedTimer : currentTimer
            )
          : [...pausedTimers, resumedTimer],
        version: TIMER_DECK_VERSION,
      };
    });
  }, [resumeFromEntry]);

  // Timer logic
  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();

        updateActiveTimer(prev => ({
          ...prev,
          elapsedTime: timerElapsedMs(prev, now),
        }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerDeck.activeTimerId, timer.isRunning, timer.startTime]);

  const startTimer = () => {
    const now = Date.now();

    setTimerDeck(prev => ({
      ...prev,
      timers: pauseRunningTimers(prev.timers, now, prev.activeTimerId).map(
        currentTimer =>
          currentTimer.id === prev.activeTimerId
            ? {
                ...currentTimer,
                elapsedTime: timerElapsedMs(currentTimer, now),
                isRunning: true,
                startTime: now - timerElapsedMs(currentTimer, now),
              }
            : currentTimer
      ),
    }));
    toast.success(i18n.t("timer.timerStarted"));
  };

  const pauseTimer = () => {
    updateActiveTimer(prev => ({
      ...prev,
      elapsedTime: timerElapsedMs(prev),
      isRunning: false,
      startTime: null,
    }));
    toast.info(i18n.t("timer.timerPaused"));
  };

  const stopTimer = () => {
    const elapsedTime = timerElapsedMs(timer);

    if (elapsedTime > 0) {
      updateActiveTimer(prev => ({
        ...prev,
        elapsedTime,
        isRunning: false,
        startTime: null,
      }));
      setShowSaveDialog(true);
    } else {
      resetTimer();
    }
  };

  const resetTimer = () => {
    setTimerDeck(prev => {
      if (prev.timers.length <= 1) {
        const nextTimer = defaultTimerState();

        return {
          activeTimerId: nextTimer.id,
          timers: [nextTimer],
          version: TIMER_DECK_VERSION,
        };
      }

      const remainingTimers = prev.timers.filter(
        currentTimer => currentTimer.id !== prev.activeTimerId
      );
      const nextActiveTimer = remainingTimers[0] || defaultTimerState();

      return {
        activeTimerId: nextActiveTimer.id,
        timers: remainingTimers.length ? remainingTimers : [nextActiveTimer],
        version: TIMER_DECK_VERSION,
      };
    });
    toast.info(i18n.t("timer.timerReset"));
  };

  const discardTimer = () => {
    resetTimer();
    setShowSaveDialog(false);
  };

  const saveTimerMutation = useMutation({
    mutationFn: async () => {
      const duration = Math.floor(timer.elapsedTime / 1000 / 60); // Convert to minutes
      if (duration < 1) {
        throw new Error(i18n.t("timer.durationAtLeastOneMinute"));
      }

      const entry = {
        project_id: timer.projectId,
        timesheet_entry: {
          work_date: new Date().toISOString().split("T")[0],
          duration,
          note: timer.description,
          bill_status: projectsData?.projects.find(
            p => p.id === timer.projectId
          )?.billable
            ? "unbilled"
            : "non_billable",
        },
      };

      const response = await timesheetEntryApi.create(entry, user?.id);

      return response.data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      toast.success(i18n.t("timer.timeEntrySavedSuccessfully"));
      resetTimer();
      setShowSaveDialog(false);
      if (onSaveEntry) {
        onSaveEntry(data);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || i18n.t("timer.failedToSaveTimeEntry"));
    },
  });

  const handleSaveEntry = () => {
    saveTimerMutation.mutate();
  };

  const handleProjectChange = (projectName: string) => {
    const project = projectsData?.projects.find(p => p.name === projectName);
    if (project) {
      updateActiveTimer(prev => ({
        ...prev,
        project: projectName,
        client: project.client,
        projectId: project.id,
      }));
    }
  };

  const addTimer = () => {
    const now = Date.now();
    const nextTimer = {
      ...createTimerState(),
      isRunning: true,
      startTime: now,
    };

    setTimerDeck(prev => ({
      activeTimerId: nextTimer.id,
      timers: [...pauseRunningTimers(prev.timers, now), nextTimer],
      version: TIMER_DECK_VERSION,
    }));
  };

  const switchTimer = (timerId: string) => {
    const now = Date.now();

    setTimerDeck(prev => ({
      activeTimerId: timerId,
      timers: pauseRunningTimers(prev.timers, now, timerId).map(currentTimer =>
        currentTimer.id === timerId
          ? {
              ...currentTimer,
              elapsedTime: timerElapsedMs(currentTimer, now),
              isRunning: true,
              startTime: now - timerElapsedMs(currentTimer, now),
            }
          : currentTimer
      ),
      version: TIMER_DECK_VERSION,
    }));
  };

  const timerLabel = (timerState: TimerState) =>
    timerState.description ||
    timerState.project ||
    i18n.t("timer.untitledTimer");

  const isPristineTimer =
    timerDeck.timers.length === 1 &&
    !timer.isRunning &&
    timer.elapsedTime === 0 &&
    !timer.project &&
    !timer.description;

  const timerSwitcher = (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="timer-switcher"
    >
      {timerDeck.timers.map(currentTimer => {
        const isActive = currentTimer.id === timerDeck.activeTimerId;
        const isRunning = currentTimer.isRunning;

        return (
          <button
            key={currentTimer.id}
            type="button"
            aria-pressed={isActive}
            data-testid="timer-switcher-item"
            onClick={() => switchTimer(currentTimer.id)}
            className={cn(
              "min-w-28 max-w-48 rounded-md border px-3 py-2 text-left text-xs transition",
              isActive
                ? "border-sky-300 bg-sky-50 text-sky-950 shadow-sm dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-50"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
              isRunning && "ring-1 ring-emerald-300 dark:ring-emerald-800"
            )}
          >
            <span className="flex items-center gap-1.5 truncate font-medium">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  isRunning ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
              <span className="truncate">{timerLabel(currentTimer)}</span>
            </span>
            <span className="block font-mono tabular-nums">
              {formatTimerDuration(timerElapsedMs(currentTimer))}
            </span>
          </button>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={addTimer}
        data-testid="timer-new"
      >
        <Plus size={14} className="mr-1" />
        {i18n.t("timer.newTimer")}
      </Button>
    </div>
  );

  const desktopSyncBadge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
        isDesktopSynced
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-border bg-muted text-muted-foreground"
      )}
      data-testid="timer-desktop-sync"
    >
      <Desktop size={13} weight="duotone" />
      {isDesktopSynced
        ? i18n.t("timer.sharedWithDesktop")
        : i18n.t("timer.localTimer")}
    </span>
  );

  const saveEntrySummary = (
    <>
      <div className="space-y-4">
        <div>
          <Label>{i18n.t("project")}</Label>
          <p className="text-sm text-muted-foreground">
            {timer.project} ({timer.client})
          </p>
        </div>

        <div>
          <Label>{i18n.t("timeTracking.duration")}</Label>
          <p className="text-sm text-muted-foreground">
            {formatTimerDuration(timer.elapsedTime)}
          </p>
        </div>

        {timer.description && (
          <div>
            <Label>{i18n.t("description")}</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {timer.description}
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={discardTimer}>
          {i18n.t("timer.discard")}
        </Button>
        <Button
          onClick={handleSaveEntry}
          disabled={saveTimerMutation.isPending || !timer.project}
        >
          {saveTimerMutation.isPending
            ? i18n.t("timeTracking.saving")
            : i18n.t("timeTracking.saveEntry")}
        </Button>
      </DialogFooter>
    </>
  );

  if (isPristineTimer) {
    if (isInline) {
      return (
        <Card className="mb-4 overflow-hidden border border-sky-200 bg-card shadow-sm dark:border-sky-900">
          <div className="h-1 bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400" />
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                <Timer size={18} className="text-primary" />
                <span>{i18n.t("timer.webTimer")}</span>
                {desktopSyncBadge}
              </div>
              <p className="text-sm text-muted-foreground">
                {i18n.t("timer.trackLiveWork")}
              </p>
            </div>
            <Button onClick={startTimer} className="min-w-36 shadow-sm">
              <Play size={16} className="mr-2" />
              {i18n.t("timer.startTimer")}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="fixed bottom-6 left-6 z-50">
        <Button onClick={startTimer} className="shadow-lg">
          <Play size={16} className="mr-2" />
          {i18n.t("timer.startTimer")}
        </Button>
      </div>
    );
  }

  if (isInline) {
    return (
      <>
        <Card
          className={cn(
            "mb-4 overflow-hidden border shadow-sm transition-all duration-300",
            timer.isRunning
              ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20"
              : "border-border bg-card"
          )}
          data-testid="inline-web-timer"
        >
          <div
            className={cn(
              "h-1",
              timer.isRunning
                ? "bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400"
                : "bg-gradient-to-r from-sky-500 via-slate-300 to-amber-400"
            )}
          />
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <Timer
                    size={20}
                    className={
                      timer.isRunning
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {i18n.t("timer.webTimerLabel")}
                    </p>
                    <p className="font-mono text-3xl font-bold text-foreground">
                      {formatTimerDuration(timer.elapsedTime)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {desktopSyncBadge}
                      <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                        {i18n.t("timer.activeTimers", {
                          count: timerDeck.timers.length,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {timer.isRunning ? (
                    <Button size="sm" onClick={pauseTimer} variant="outline">
                      <Pause size={16} className="mr-1" />
                      {i18n.t("timer.pause")}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={startTimer}>
                      <Play size={16} className="mr-1" />
                      {timer.elapsedTime > 0
                        ? i18n.t("timer.resume")
                        : i18n.t("timer.start")}
                    </Button>
                  )}
                  <Button size="sm" onClick={stopTimer} variant="outline">
                    <Stop size={16} className="mr-1" />
                    {i18n.t("timer.stop")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={discardTimer}>
                    <X size={16} className="mr-1" />
                    {i18n.t("timer.reset")}
                  </Button>
                </div>
              </div>

              {timerSwitcher}

              <div className="grid gap-3 lg:grid-cols-[minmax(0,280px)_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="timer-project-inline" className="text-xs">
                    {i18n.t("project")}
                  </Label>
                  <Select
                    value={timer.project}
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger id="timer-project-inline" className="h-10">
                      <SelectValue
                        placeholder={i18n.t("timer.selectProject")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.projects.map(project => (
                        <SelectItem key={project.id} value={project.name}>
                          {project.name} ({project.client})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timer-description-inline" className="text-xs">
                    {i18n.t("description")}
                  </Label>
                  <Textarea
                    id="timer-description-inline"
                    value={timer.description}
                    onChange={e =>
                      updateActiveTimer(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={i18n.t("timer.whatAreYouWorkingOn")}
                    className="min-h-10 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{i18n.t("timer.saveTimeEntry")}</DialogTitle>
              <DialogDescription>
                {i18n.t("timer.saveTimeEntryDescription", {
                  time: formatTimerDuration(timer.elapsedTime),
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">{saveEntrySummary}</div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {/* Floating Timer */}
      <div className="fixed bottom-6 left-6 z-50">
        <Card
          className={cn(
            "border-2 bg-card/95 shadow-lg backdrop-blur transition-all duration-300",
            timer.isRunning ? "border-green-500" : "border-border",
            isMinimized ? "w-48" : "w-80"
          )}
        >
          <CardContent className="p-4">
            {isMinimized ? (
              // Minimized view
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer
                    size={20}
                    className={
                      timer.isRunning
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  />
                  <span className="font-mono text-lg font-bold text-foreground">
                    {formatTimerDuration(timer.elapsedTime)}
                  </span>
                </div>
                <div className="flex gap-1">
                  {timer.isRunning ? (
                    <Button size="sm" variant="ghost" onClick={pauseTimer}>
                      <Pause size={16} />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={startTimer}>
                      <Play size={16} />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(false)}
                  >
                    <CaretUp size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              // Expanded view
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer
                      size={20}
                      className={
                        timer.isRunning
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    />
                    <span className="font-semibold text-foreground">
                      {i18n.t("timer.timer")}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsMinimized(true)}
                    >
                      <CaretDown size={16} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={discardTimer}>
                      <X size={16} />
                    </Button>
                  </div>
                </div>

                {timerSwitcher}

                <div className="text-center">
                  <div className="mb-2 font-mono text-3xl font-bold text-foreground">
                    {formatTimerDuration(timer.elapsedTime)}
                  </div>
                  <div className="flex justify-center gap-2">
                    {timer.isRunning ? (
                      <Button size="sm" onClick={pauseTimer} variant="outline">
                        <Pause size={16} className="mr-1" />
                        {i18n.t("timer.pause")}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={startTimer}>
                        <Play size={16} className="mr-1" />
                        {i18n.t("timer.start")}
                      </Button>
                    )}
                    <Button size="sm" onClick={stopTimer} variant="outline">
                      <Stop size={16} className="mr-1" />
                      {i18n.t("timer.stop")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="timer-project" className="text-xs">
                      {i18n.t("project")}
                    </Label>
                    <Select
                      value={timer.project}
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue
                          placeholder={i18n.t("timer.selectProject")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {projectsData?.projects.map(project => (
                          <SelectItem key={project.id} value={project.name}>
                            {project.name} ({project.client})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timer-description" className="text-xs">
                      {i18n.t("description")}
                    </Label>
                    <Textarea
                      id="timer-description"
                      value={timer.description}
                      onChange={e =>
                        updateActiveTimer(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder={i18n.t("timer.whatAreYouWorkingOn")}
                      className="h-16 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Entry Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t("timer.saveTimeEntry")}</DialogTitle>
            <DialogDescription>
              {i18n.t("timer.saveTimeEntryDescription", {
                time: formatTimerDuration(timer.elapsedTime),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">{saveEntrySummary}</div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingTimer;
