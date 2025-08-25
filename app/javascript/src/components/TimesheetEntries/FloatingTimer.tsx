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
import timesheetEntryApi from "../../apis/timesheet-entry";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

interface FloatingTimerProps {
  onSaveEntry?: (entry: any) => void;
}

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  project: string;
  client: string;
  description: string;
  projectId: number;
}

const TIMER_STORAGE_KEY = "miru_timer_state";

const FloatingTimer: React.FC<FloatingTimerProps> = ({ onSaveEntry }) => {
  const { user, company } = useUserContext();
  const queryClient = useQueryClient();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        ...parsed,
        startTime: parsed.isRunning ? Date.now() - parsed.elapsedTime : null,
      };
    }

    return {
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      project: "",
      client: "",
      description: "",
      projectId: 0,
    };
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch projects and clients from API
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        // Fetch clients
        const clientsResponse = await axios.get("/api/v1/clients");
        const clients = clientsResponse.data.clients || [];

        // Fetch projects
        const projectsResponse = await axios.get("/api/v1/projects");
        const projects = projectsResponse.data.projects || [];

        // Transform data to match expected format
        return {
          clients: clients.map(client => ({
            id: client.id,
            name: client.name,
          })),
          projects: projects.map(project => ({
            id: project.id,
            name: project.name,
            client: project.client?.name || "No Client",
            clientId: project.client?.id || null,
            billable: project.billable || false,
          })),
        };
      } catch (error) {
        console.error("Error fetching projects data:", error);

        return { clients: [], projects: [] };
      }
    },
  });

  // Save timer state to localStorage
  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
  }, [timer]);

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
    toast.success("Timer started");
  };

  const pauseTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
    }));
    toast.info("Timer paused");
  };

  const stopTimer = () => {
    if (timer.elapsedTime > 0) {
      setShowSaveDialog(true);
    } else {
      resetTimer();
    }
  };

  const resetTimer = () => {
    setTimer({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      project: "",
      client: "",
      description: "",
      projectId: 0,
    });
    localStorage.removeItem(TIMER_STORAGE_KEY);
    toast.info("Timer reset");
  };

  const discardTimer = () => {
    resetTimer();
    setShowSaveDialog(false);
  };

  const saveTimerMutation = useMutation({
    mutationFn: async () => {
      const duration = Math.floor(timer.elapsedTime / 1000 / 60); // Convert to minutes
      if (duration < 1) {
        throw new Error("Duration must be at least 1 minute");
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
      toast.success("Time entry saved successfully");
      resetTimer();
      setShowSaveDialog(false);
      if (onSaveEntry) {
        onSaveEntry(data);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save time entry");
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

  // Don't render if timer has never been used
  if (!timer.isRunning && timer.elapsedTime === 0 && !timer.project) {
    return null;
  }

  return (
    <>
      {/* Floating Timer */}
      <div className="fixed bottom-6 left-6 z-50">
        <Card
          className={cn(
            "bg-white shadow-lg border-2 transition-all duration-300",
            timer.isRunning ? "border-green-500" : "border-gray-200",
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
                      timer.isRunning ? "text-green-600" : "text-gray-400"
                    }
                  />
                  <span className="font-mono text-lg font-bold">
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
                        timer.isRunning ? "text-green-600" : "text-gray-400"
                      }
                    />
                    <span className="font-semibold">Timer</span>
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
                  <div className="font-mono text-3xl font-bold mb-2">
                    {formatTime(timer.elapsedTime)}
                  </div>
                  <div className="flex justify-center gap-2">
                    {timer.isRunning ? (
                      <Button size="sm" onClick={pauseTimer} variant="outline">
                        <Pause size={16} className="mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm" onClick={startTimer}>
                        <Play size={16} className="mr-1" />
                        Start
                      </Button>
                    )}
                    <Button size="sm" onClick={stopTimer} variant="outline">
                      <Stop size={16} className="mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="timer-project" className="text-xs">
                      Project
                    </Label>
                    <Select
                      value={timer.project}
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select project" />
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
                      Description
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
                      placeholder="What are you working on?"
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
            <DialogTitle>Save Time Entry</DialogTitle>
            <DialogDescription>
              You tracked {formatTime(timer.elapsedTime)}. Would you like to
              save this as a time entry?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <p className="text-sm text-gray-600">
                {timer.project} ({timer.client})
              </p>
            </div>

            <div>
              <Label>Duration</Label>
              <p className="text-sm text-gray-600">
                {formatTime(timer.elapsedTime)}
              </p>
            </div>

            {timer.description && (
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600">{timer.description}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={discardTimer}>
              Discard
            </Button>
            <Button
              onClick={handleSaveEntry}
              disabled={saveTimerMutation.isPending || !timer.project}
            >
              {saveTimerMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingTimer;
