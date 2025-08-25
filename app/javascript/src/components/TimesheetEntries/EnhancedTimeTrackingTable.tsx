import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DataTable } from "../ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Plus,
  DotsThree,
  PencilSimple,
  Trash,
  Timer,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  HourglassMedium,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import timesheetEntryApi from "../../apis/timesheet-entry";
import { minToHHMM } from "../../helpers";
import { toast } from "sonner";
import FloatingTimer from "./FloatingTimer";
import EnhancedTimeEntryDialog from "./EnhancedTimeEntryDialog";

dayjs.extend(weekday);
dayjs.extend(isoWeek);

interface TimeEntry {
  id: string;
  date: string;
  client: string;
  project: string;
  task: string;
  description: string;
  duration: number; // in minutes
  billable: boolean;
  status: "pending" | "approved" | "rejected";
  userId: string;
  userName?: string;
  projectId: number;
}

interface TimeTrackingData {
  entries: TimeEntry[];
  totalHours: number;
  billableHours: number;
  weeklyTotal: number;
}

const fetchTimeEntries = async (
  startDate: string,
  endDate: string
): Promise<TimeTrackingData> => {
  const response = await timesheetEntryApi.index({
    from: startDate,
    to: endDate,
  });

  // Transform the response to match our interface
  const entries = response.data.entries || [];
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const billableMinutes = entries
    .filter(e => e.billable)
    .reduce((sum, entry) => sum + entry.duration, 0);

  return {
    entries,
    totalHours: totalMinutes / 60,
    billableHours: billableMinutes / 60,
    weeklyTotal: totalMinutes,
  };
};

const EnhancedTimeTrackingTable: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdminUser, user } = useUserContext();

  // Current date and view state
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Calculate date range based on view
  const getDateRange = () => {
    switch (view) {
      case "day":
        return {
          start: currentDate.format("YYYY-MM-DD"),
          end: currentDate.format("YYYY-MM-DD"),
          label: currentDate.format("MMMM D, YYYY"),
        };
      case "week": {
        const weekStart = currentDate.startOf("isoWeek");
        const weekEnd = currentDate.endOf("isoWeek");

        return {
          start: weekStart.format("YYYY-MM-DD"),
          end: weekEnd.format("YYYY-MM-DD"),
          label: `${weekStart.format("MMM D")} - ${weekEnd.format(
            "MMM D, YYYY"
          )}`,
        };
      }
      case "month": {
        const monthStart = currentDate.startOf("month");
        const monthEnd = currentDate.endOf("month");

        return {
          start: monthStart.format("YYYY-MM-DD"),
          end: monthEnd.format("YYYY-MM-DD"),
          label: currentDate.format("MMMM YYYY"),
        };
      }
      default:
        return {
          start: currentDate.format("YYYY-MM-DD"),
          end: currentDate.format("YYYY-MM-DD"),
          label: currentDate.format("MMMM D, YYYY"),
        };
    }
  };

  const dateRange = getDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ["timeEntries", dateRange.start, dateRange.end, view],
    queryFn: () => fetchTimeEntries(dateRange.start, dateRange.end),
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await timesheetEntryApi.destroy(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      toast.success("Time entry deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete time entry");
    },
  });

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setShowEditDialog(true);
  };

  const handleDelete = (entryId: string) => {
    deleteMutation.mutate(entryId);
  };

  const handleAddEntry = (date?: string) => {
    setSelectedDate(date || currentDate.format("YYYY-MM-DD"));
    setSelectedEntry(null);
    setShowAddDialog(true);
  };

  const navigate = (direction: "prev" | "next") => {
    switch (view) {
      case "day":
        setCurrentDate(prev =>
          direction === "prev" ? prev.subtract(1, "day") : prev.add(1, "day")
        );
        break;
      case "week":
        setCurrentDate(prev =>
          direction === "prev" ? prev.subtract(1, "week") : prev.add(1, "week")
        );
        break;
      case "month":
        setCurrentDate(prev =>
          direction === "prev"
            ? prev.subtract(1, "month")
            : prev.add(1, "month")
        );
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
  };

  const formatDuration = (minutes: number) => minToHHMM(minutes);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-1" title="Approved">
            <CheckCircle size={20} weight="fill" className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1" title="Rejected">
            <XCircle size={20} weight="fill" className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1" title="Pending">
            <HourglassMedium
              size={20}
              weight="fill"
              className="text-amber-600"
            />
            <span className="text-sm text-amber-700 font-medium">Pending</span>
          </div>
        );
    }
  };

  const columns: ColumnDef<TimeEntry>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => {
        const date = dayjs(row.original.date);

        return (
          <div className="flex items-center gap-2">
            <CalendarBlank size={16} className="text-gray-400" />
            <div>
              <p className="font-medium">{date.format("ddd, MMM D")}</p>
              <p className="text-xs text-gray-500">{date.format("YYYY")}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.original.client}</div>
      ),
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.project}</p>
          {row.original.task && (
            <p className="text-sm text-gray-500">{row.original.task}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {row.original.description || "—"}
        </div>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Duration
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-gray-400" />
          <span className="font-medium">
            {formatDuration(row.original.duration)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "billable",
      header: "Type",
      cell: ({ row }) =>
        row.original.billable ? (
          <Badge variant="outline" className="text-green-700">
            Billable
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600">
            Non-billable
          </Badge>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const entry = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsThree size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(entry.id)}
              >
                Copy entry ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                <PencilSimple size={16} className="mr-2" />
                Edit entry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedEntry(entry);
                  setShowAddDialog(true);
                }}
              >
                Duplicate entry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(entry.id)}
                className="text-red-600"
              >
                <Trash size={16} className="mr-2" />
                Delete entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Calendar grid for week/month view
  const renderCalendarGrid = () => {
    if (view === "day") return null;

    const entries = data?.entries || [];

    if (view === "week") {
      const weekStart = currentDate.startOf("isoWeek");
      const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

      return (
        <div className="grid grid-cols-7 gap-2 mb-6">
          {days.map(day => {
            const dayEntries = entries.filter(entry =>
              dayjs(entry.date).isSame(day, "day")
            );

            const totalDuration = dayEntries.reduce(
              (sum, entry) => sum + entry.duration,
              0
            );

            return (
              <Card
                key={day.format("YYYY-MM-DD")}
                className={cn(
                  "cursor-pointer transition-colors hover:border-blue-300",
                  day.isSame(dayjs(), "day") && "border-blue-500 bg-blue-50"
                )}
                onClick={() => handleAddEntry(day.format("YYYY-MM-DD"))}
              >
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-sm font-medium">{day.format("ddd")}</p>
                    <p className="text-lg font-bold">{day.format("D")}</p>
                    {totalDuration > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {formatDuration(totalDuration)}
                      </p>
                    )}
                  </div>
                  {dayEntries.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayEntries.slice(0, 2).map(entry => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 bg-gray-100 rounded truncate"
                        >
                          {entry.project}
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayEntries.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }

    if (view === "month") {
      const monthStart = currentDate.startOf("month").startOf("isoWeek");
      const monthEnd = currentDate.endOf("month").endOf("isoWeek");
      const days = [];
      let day = monthStart;

      while (day.isBefore(monthEnd) || day.isSame(monthEnd, "day")) {
        days.push(day);
        day = day.add(1, "day");
      }

      return (
        <div className="mb-6">
          {/* Month header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(dayName => (
              <div
                key={dayName}
                className="text-center text-sm font-medium text-gray-500 p-2"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayEntries = entries.filter(entry =>
                dayjs(entry.date).isSame(day, "day")
              );

              const totalDuration = dayEntries.reduce(
                (sum, entry) => sum + entry.duration,
                0
              );
              const isCurrentMonth = day.isSame(currentDate, "month");
              const isToday = day.isSame(dayjs(), "day");

              return (
                <Card
                  key={day.format("YYYY-MM-DD")}
                  className={cn(
                    "cursor-pointer transition-colors hover:border-blue-300 h-20",
                    !isCurrentMonth && "opacity-40",
                    isToday && "border-blue-500 bg-blue-50"
                  )}
                  onClick={() => handleAddEntry(day.format("YYYY-MM-DD"))}
                >
                  <CardContent className="p-2 h-full">
                    <div className="text-xs font-medium mb-1">
                      {day.format("D")}
                    </div>
                    {totalDuration > 0 && (
                      <div className="text-xs text-blue-600">
                        {formatDuration(totalDuration)}
                      </div>
                    )}
                    {dayEntries.length > 0 && (
                      <div className="mt-1">
                        <div className="text-xs bg-gray-100 rounded px-1 truncate">
                          {dayEntries[0].project}
                        </div>
                        {dayEntries.length > 1 && (
                          <div className="text-xs text-gray-500">
                            +{dayEntries.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Failed to load time entries</p>
        </div>
      </div>
    );
  }

  const entries = data?.entries || [];
  const totalHours = data?.totalHours || 0;
  const billableHours = data?.billableHours || 0;
  const billablePercentage =
    totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  const averageDaily =
    view === "week"
      ? totalHours / 5
      : view === "month"
      ? totalHours / dayjs(currentDate).daysInMonth()
      : totalHours;

  return (
    <>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-gray-600 mt-1">
              Track your time and manage timesheet entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAddEntry()}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus size={20} className="mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("prev")}
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("next")}
                >
                  <ArrowRight size={16} />
                </Button>
              </div>
              <div className="text-lg font-semibold">{dateRange.label}</div>
              <Tabs value={view} onValueChange={v => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Timer size={20} className="text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
              <p className="text-xs text-gray-600 mt-1">This {view}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Billable Hours
              </CardTitle>
              <Clock size={20} className="text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {billableHours.toFixed(1)}h
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {billablePercentage.toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Daily Average
              </CardTitle>
              <Calendar size={20} className="text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageDaily.toFixed(1)}h
              </div>
              <p className="text-xs text-gray-600 mt-1">Per working day</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        {renderCalendarGrid()}

        {/* Data Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              View and manage your timesheet entries for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length > 0 ? (
              <DataTable
                columns={columns}
                data={entries}
                searchPlaceholder="Search entries..."
              />
            ) : (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">
                  No time entries for this period
                </p>
                <Button variant="outline" onClick={() => handleAddEntry()}>
                  <Plus size={20} className="mr-2" />
                  Add Your First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Timer */}
      <FloatingTimer />

      {/* Add/Edit Entry Dialog */}
      <EnhancedTimeEntryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        entry={selectedEntry}
        selectedDate={selectedDate}
      />

      <EnhancedTimeEntryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        entry={selectedEntry}
      />
    </>
  );
};

export default EnhancedTimeTrackingTable;
