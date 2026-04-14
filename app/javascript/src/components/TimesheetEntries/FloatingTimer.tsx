import React, { useState, useEffect, useRef } from "react";
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
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useUserContext } from "../../context/UserContext";
import { i18n } from "../../i18n";
import { timesheetEntryApi } from "apis/api";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  loadStoredTimerState,
  persistTimerState,
  clearStoredTimerState,
  defaultTimerState,
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

type TimerState = ReturnType<typeof defaultTimerState>;

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
  const [timer, setTimer] = useState<TimerState>(() => loadStoredTimerState());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    persistTimerState(timer);
  }, [timer]);

  useEffect(() => {
    setTimer(loadStoredTimerState());
  }, [externalSyncKey]);

  useEffect(() => {
    if (!resumeFromEntry) return;

    setTimer({
      isRunning: true,
      startTime: resumeFromEntry.resumeAt,
      elapsedTime: 0,
      client: resumeFromEntry.client,
      project: resumeFromEntry.project,
      description: resumeFromEntry.description || "",
      projectId: resumeFromEntry.projectId,
    });
  }, [resumeFromEntry]);

  // Timer logic
  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          elapsedTime: prev.startTime
            ? Date.now() - prev.startTime
            : prev.elapsedTime,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, timer.startTime]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - prev.elapsedTime,
    }));
    toast.success(i18n.t("timer.timerStarted"));
  };

  const pauseTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
    }));
    toast.info(i18n.t("timer.timerPaused"));
  };

  const stopTimer = () => {
    if (timer.elapsedTime > 0) {
      setShowSaveDialog(true);
    } else {
      resetTimer();
    }
  };

  const resetTimer = () => {
    setTimer(defaultTimerState());
    clearStoredTimerState();
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
      setTimer(prev => ({
        ...prev,
        project: projectName,
        client: project.client,
        projectId: project.id,
      }));
    }
  };

  const isPristineTimer =
    !timer.isRunning && timer.elapsedTime === 0 && !timer.project;

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
            {formatTime(timer.elapsedTime)}
          </p>
        </div>

        {timer.description && (
          <div>
            <Label>{i18n.t("description")}</Label>
            <p className="text-sm text-muted-foreground">{timer.description}</p>
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
        <Card className="mb-4 border border-border bg-card/95 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Timer size={18} className="text-primary" />
                <span>{i18n.t("timer.webTimer")}</span>
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
            "mb-4 border shadow-sm transition-all duration-300",
            timer.isRunning
              ? "border-green-500 bg-green-50/40"
              : "border-border bg-card/95"
          )}
          data-testid="inline-web-timer"
        >
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
                      {formatTime(timer.elapsedTime)}
                    </p>
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
                      setTimer(prev => ({
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
                  time: formatTime(timer.elapsedTime),
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
                    {formatTime(timer.elapsedTime)}
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

                <div className="text-center">
                  <div className="mb-2 font-mono text-3xl font-bold text-foreground">
                    {formatTime(timer.elapsedTime)}
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
                        setTimer(prev => ({
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
                time: formatTime(timer.elapsedTime),
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
