import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  MagnifyingGlass,
  Timer,
  Target,
  Lightning,
  BarChart3,
  Users,
  CheckCircle,
  Warning,
  DotsThree,
} from "phosphor-react";
import { cn } from "../../../lib/utils";

interface TimeEntry {
  id: string;
  project: string;
  client: string;
  description: string;
  duration: number; // in minutes
  date: string;
  status: "running" | "paused" | "completed";
  billable: boolean;
  user: {
    name: string;
    avatar?: string;
  };
}

interface Project {
  id: string;
  name: string;
  client: string;
  color: string;
  totalHours: number;
  targetHours: number;
  isActive: boolean;
}

interface TimeTrackingPageProps {
  className?: string;
}

const TimeTrackingPage: React.FC<TimeTrackingPageProps> = ({ className }) => {
  const [currentTimer, setCurrentTimer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Mock data
  const mockProjects: Project[] = [
    {
      id: "1",
      name: "Website Redesign",
      client: "Acme Corp",
      color: "bg-sky-500",
      totalHours: 45.5,
      targetHours: 60,
      isActive: true,
    },
    {
      id: "2",
      name: "Mobile App Development",
      client: "TechStart Inc",
      color: "bg-green-500",
      totalHours: 32.0,
      targetHours: 80,
      isActive: true,
    },
    {
      id: "3",
      name: "Brand Identity",
      client: "Creative Studio",
      color: "bg-primary",
      totalHours: 18.5,
      targetHours: 25,
      isActive: false,
    },
  ];

  const mockTimeEntries: TimeEntry[] = [
    {
      id: "1",
      project: "Website Redesign",
      client: "Acme Corp",
      description: "Working on homepage layout and responsive design",
      duration: 240, // 4 hours
      date: "2024-01-15",
      status: "completed",
      billable: true,
      user: { name: "John Doe" },
    },
    {
      id: "2",
      project: "Mobile App Development",
      client: "TechStart Inc",
      description: "Implementing user authentication flow",
      duration: 180, // 3 hours
      date: "2024-01-15",
      status: "running",
      billable: true,
      user: { name: "Jane Smith" },
    },
    {
      id: "3",
      project: "Brand Identity",
      client: "Creative Studio",
      description: "Logo concepts and color palette",
      duration: 120, // 2 hours
      date: "2024-01-14",
      status: "completed",
      billable: false,
      user: { name: "Mike Johnson" },
    },
  ];

  const todayStats = {
    totalHours: 7.5,
    billableHours: 6.0,
    projects: 3,
    productivity: 85,
  };

  const weeklyStats = {
    totalHours: 42.5,
    target: 40,
    billableHours: 38.0,
    overtime: 2.5,
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: Play,
      },
      paused: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Pause,
      },
      completed: {
        color: "bg-sky-100 text-sky-800 border-sky-200",
        icon: CheckCircle,
      },
    };

    const variant = variants[status] || variants.completed;
    const Icon = variant.icon;

    return (
      <Badge
        className={cn("capitalize flex items-center gap-1", variant.color)}
      >
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleTimerAction = (
    action: "start" | "pause" | "stop",
    entryId?: string
  ) => {
    if (action === "start" && entryId) {
      setCurrentTimer(entryId);
    } else if (action === "pause" || action === "stop") {
      setCurrentTimer(null);
    }
  };

  const filteredEntries = mockTimeEntries.filter(
    entry =>
      entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("min-h-screen bg-muted/30", className)}>
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Time Tracking
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track time across projects and monitor productivity
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-nowrap">
              {/* Date Picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto"
              />

              {/* MagnifyingGlass */}
              <div className="relative w-full sm:flex-1 lg:w-72 lg:flex-none">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Entries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4 sm:p-6">
        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Hours</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayStats.totalHours}h
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">
                    +1.2h from yesterday
                  </p>
                </div>
                <Timer className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Billable Hours
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayStats.billableHours}h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      (todayStats.billableHours / todayStats.totalHours) * 100
                    )}
                    % billable
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Projects
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayStats.projects}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {mockProjects.filter(p => p.isActive).length} clients
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Productivity</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayStats.productivity}%
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">+5% this week</p>
                </div>
                <Lightning className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Timer / Quick Start */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  Quick Timer
                </CardTitle>
                <CardDescription>
                  Start tracking time on your active projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockProjects
                  .filter(p => p.isActive)
                  .map(project => (
                    <div
                      key={project.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 border-border sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn("w-3 h-3 rounded-full", project.color)}
                        />
                        <div>
                          <h4 className="font-medium text-foreground">
                            {project.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {project.client}
                          </p>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                        <span className="text-sm text-muted-foreground">
                          {project.totalHours}h / {project.targetHours}h
                        </span>
                        <Button
                          size="sm"
                          variant={
                            currentTimer === project.id
                              ? "destructive"
                              : "default"
                          }
                          onClick={() =>
                            handleTimerAction(
                              currentTimer === project.id ? "stop" : "start",
                              project.id
                            )
                          }
                        >
                          {currentTimer === project.id ? (
                            <>
                              <Square className="w-4 h-4 mr-1" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Recent Time Entries */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Recent Entries
                </CardTitle>
                <CardDescription>
                  Your latest time tracking activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={entry.user.avatar}
                            alt={entry.user.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(entry.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-foreground">
                              {entry.project}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              •
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {entry.client}
                            </span>
                            {entry.billable && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-emerald-100 text-emerald-700"
                              >
                                Billable
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {entry.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {formatDuration(entry.duration)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.date}
                          </p>
                        </div>
                        {getStatusBadge(entry.status)}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <DotsThree className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Weekly Overview */}
          <div className="space-y-6">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Progress</CardTitle>
                <CardDescription>Your week at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="font-medium">
                      {weeklyStats.totalHours}h / {weeklyStats.target}h
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (weeklyStats.totalHours / weeklyStats.target) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Billable Hours
                    </span>
                    <span className="font-medium">
                      {weeklyStats.billableHours}h
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (weeklyStats.billableHours / weeklyStats.totalHours) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {weeklyStats.overtime > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <Warning className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Overtime Alert
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                      You've worked {weeklyStats.overtime}h overtime this week
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Progress</CardTitle>
                <CardDescription>Hours logged per project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockProjects.map(project => (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn("w-2 h-2 rounded-full", project.color)}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {project.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {project.totalHours}h
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full", project.color)}
                        style={{
                          width: `${Math.min(
                            (project.totalHours / project.targetHours) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingPage;
