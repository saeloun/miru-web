import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Plus,
  DotsThree,
  PencilSimple,
  Trash,
  Timer,
  Calendar,
  Play,
  Pause,
  Clock,
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  ArrowUp,
  ArrowDown,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import { timesheetEntryApi } from "apis/api";
import { minToHHMM } from "../../helpers";
import { toast } from "sonner";

dayjs.extend(weekday);

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

const TimeTrackingTable: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdminUser, user } = useUserContext();
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = dayjs();

    return {
      start: now.startOf("week").format("YYYY-MM-DD"),
      end: now.endOf("week").format("YYYY-MM-DD"),
    };
  });
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTimer, setCurrentTimer] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["timeEntries", selectedWeek.start, selectedWeek.end],
    queryFn: () => fetchTimeEntries(selectedWeek.start, selectedWeek.end),
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await timesheetEntryApi.destroy(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      toast.success("Time entry deleted successfully");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to delete time entry");
    },
  });

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setShowEditDialog(true);
  };

  const handleDelete = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedEntry) {
      deleteMutation.mutate(selectedEntry.id);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const currentStart = dayjs(selectedWeek.start);
    const newStart =
      direction === "prev"
        ? currentStart.subtract(1, "week")
        : currentStart.add(1, "week");

    setSelectedWeek({
      start: newStart.startOf("week").format("YYYY-MM-DD"),
      end: newStart.endOf("week").format("YYYY-MM-DD"),
    });
  };

  const goToToday = () => {
    const now = dayjs();
    setSelectedWeek({
      start: now.startOf("week").format("YYYY-MM-DD"),
      end: now.endOf("week").format("YYYY-MM-DD"),
    });
  };

  const formatDuration = (minutes: number) => minToHHMM(minutes);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Pending
          </Badge>
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
          ) : (
            <></>
          )}
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
          ) : (
            <></>
          )}
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
                  // Duplicate entry
                  setSelectedEntry(entry);
                  setShowAddDialog(true);
                }}
              >
                Duplicate entry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(entry)}
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

  return (
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
            variant={isTracking ? "destructive" : "default"}
            onClick={() => setIsTracking(!isTracking)}
            className={cn(
              "bg-gray-900 hover:bg-gray-800 text-white",
              isTracking && "bg-red-600 hover:bg-red-700"
            )}
          >
            {isTracking ? (
              <>
                <Pause size={20} className="mr-2" />
                Stop Timer
              </>
            ) : (
              <>
                <Play size={20} className="mr-2" />
                Start Timer
              </>
            )}
          </Button>
          <Button onClick={() => setShowAddDialog(true)} variant="outline">
            <Plus size={20} className="mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("prev")}
              >
                <ArrowLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("next")}
              >
                <ArrowRight size={16} />
              </Button>
            </div>
            <div className="text-lg font-semibold">
              {dayjs(selectedWeek.start).format("MMM D")} -{" "}
              {dayjs(selectedWeek.end).format("MMM D, YYYY")}
            </div>
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
            <p className="text-xs text-gray-600 mt-1">This week</p>
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
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalHours / 5).toFixed(1)}h
            </div>
            <p className="text-xs text-gray-600 mt-1">Per working day</p>
          </CardContent>
        </Card>
      </div>

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
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus size={20} className="mr-2" />
                Add Your First Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time entry? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeTrackingTable;
