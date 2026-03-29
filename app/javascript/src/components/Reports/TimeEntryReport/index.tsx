import React, { useMemo, useState } from "react";
import Loader from "common/Loader/index";
import {
  Clock,
  Users,
  Buildings as Building2,
  Download,
  CaretDown as ChevronDown,
  Calendar as CalendarIcon,
} from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";
import { DateRange } from "react-day-picker";
import axios from "../../../apis/api";
import useInfiniteLoadTrigger from "../../../hooks/useInfiniteLoadTrigger";
import { minToHHMM } from "../../../helpers";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { cn } from "../../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarComponent } from "../../ui/calendar";

// Separate component to handle table rendering with hooks
const ReportGroupTable: React.FC<{
  group: ReportGroup;
  columns: ColumnDef<TimeEntry>[];
  getTotalHoursForGroup: (group: ReportGroup) => string;
}> = ({ group, columns, getTotalHoursForGroup }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: group.entries,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{group.label}</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="text-lg font-bold text-indigo-600">
              {getTotalHoursForGroup(group)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto rounded-md border">
          <Table className="min-w-[640px]">
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

interface TimeEntry {
  id: number;
  userId?: number;
  projectId?: number;
  duration: number;
  note: string;
  workDate: string;
  billStatus: string;
  teamMember?: string;
  project?: string;
  client?: string;
  clientLogo?: string;
}

interface ReportGroup {
  label: string;
  id: number;
  entries: TimeEntry[];
}

interface TimeEntryReportData {
  reports: ReportGroup[];
  pagy: {
    pages: number;
    first: boolean;
    prev: number | null;
    next: number | null;
    last: boolean;
    page: number;
  };
  filterOptions: {
    clients: Array<{ id: number; name: string; logo: string }>;
    teamMembers: Array<{ id: number; name: string }>;
    projects: Array<{ id: number; name: string }>;
  };
  groupByTotalDuration: {
    groupBy: string;
    groupedDurations: Record<string, number>;
  };
}

const TimeEntryReport: React.FC = () => {
  const [groupBy, setGroupBy] = useState<"client" | "project" | "team_member">(
    "client"
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [dateRangePreset, setDateRangePreset] = useState("this_month");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<TimeEntryReportData>({
    queryKey: [
      "timeEntryReport",
      groupBy,
      dateRange,
      selectedClients,
      selectedTeamMembers,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        group_by: groupBy,
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && {
          client: selectedClients.join(","),
        }),
        ...(selectedTeamMembers.length > 0 && {
          team_member: selectedTeamMembers.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/time_entries?${params.toString()}`
      );

      return response.data;
    },
    getNextPageParam: lastPage => lastPage.pagy?.next || undefined,
  });

  const lastPage = data?.pages?.[data.pages.length - 1];
  const reportPages = data?.pages || [];
  const reports = useMemo(() => {
    const mergedReports = new Map<number | string, ReportGroup>();

    reportPages.forEach(pageData => {
      (pageData.reports || []).forEach(group => {
        const groupKey = group.id ?? group.label;
        const existingGroup = mergedReports.get(groupKey);

        if (existingGroup) {
          existingGroup.entries = [...existingGroup.entries, ...group.entries];
        } else {
          mergedReports.set(groupKey, {
            ...group,
            entries: [...group.entries],
          });
        }
      });
    });

    return Array.from(mergedReports.values());
  }, [reportPages]);

  const loadMoreReportsRef = useInfiniteLoadTrigger({
    enabled: Boolean(hasNextPage),
    loading: isFetchingNextPage,
    onLoadMore: () => {
      fetchNextPage();
    },
  });

  const handleDateRangePreset = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case "this_month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "last_month": {
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      }
      case "this_quarter":
        from = startOfQuarter(now);
        to = endOfQuarter(now);
        break;
      case "this_year":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case "last_7_days":
        from = subDays(now, 7);
        to = now;
        break;
      case "last_30_days":
        from = subDays(now, 30);
        to = now;
        break;
      default:
        from = startOfMonth(now);
        to = endOfMonth(now);
    }

    setDateRange({ from, to });
    setDateRangePreset(preset);
  };

  const getTotalHoursForGroup = (group: ReportGroup): string => {
    const totalMinutes = group.entries.reduce(
      (sum, entry) => sum + entry.duration,
      0
    );

    return minToHHMM(totalMinutes);
  };

  const getTotalHoursOverall = (): string => {
    if (!reports.length) return "00:00";
    const totalMinutes = reports.reduce((total, group) => {
      const groupMinutes = group.entries.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );

      return total + groupMinutes;
    }, 0);

    return minToHHMM(totalMinutes);
  };

  const downloadMutation = useMutation({
    mutationFn: async (formatType: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format: formatType,
        group_by: groupBy,
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && {
          client: selectedClients.join(","),
        }),
        ...(selectedTeamMembers.length > 0 && {
          team_member: selectedTeamMembers.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/time_entries/download?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `time_entries_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.${formatType}`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  const columns: ColumnDef<TimeEntry>[] = [
    {
      accessorKey: "workDate",
      header: "Date",
      cell: ({ row }) => {
        const workDate = row.getValue("workDate");
        try {
          // The date is already formatted by the server
          if (!workDate || workDate === "Invalid Date") {
            return "Invalid Date";
          }

          // If it's already formatted (e.g., "12/03/2024"), return as is
          if (typeof workDate === "string" && workDate.includes("/")) {
            return workDate;
          }
          // Otherwise try to parse and format
          const date = new Date(workDate);
          if (isNaN(date.getTime())) {
            return workDate?.toString() || "Invalid Date";
          }

          return format(date, "MM/dd/yyyy");
        } catch (error) {
          console.error("Date formatting error:", error, "Value:", workDate);

          return workDate?.toString() || "Invalid Date";
        }
      },
    },
    {
      accessorKey: "teamMember",
      header: "Team Member",
      cell: ({ row }) =>
        row.original.teamMember || row.getValue("teamMember") || "Unknown User",
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) =>
        row.original.project || row.getValue("project") || "Unknown Project",
    },
    {
      accessorKey: "note",
      header: "Note",
    },
    {
      accessorKey: "duration",
      header: () => <div className="text-right">Hours</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {minToHHMM(row.getValue("duration"))}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <Loader className="h-64" />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error loading report data. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-foreground">
                Time Entry Report
              </h1>
              <p className="text-sm text-muted-foreground">
                Review hours logged by person, client, and project.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              {/* Date Range Preset Selector */}
              <Select
                value={dateRangePreset}
                onValueChange={handleDateRangePreset}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal sm:w-[280px]",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={range => {
                      setDateRange(range);
                      setDateRangePreset("custom");
                    }}
                    numberOfMonths={2}
                    disabled={date =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>

              {/* Group By Selector */}
              <Select
                value={groupBy}
                onValueChange={(value: any) => setGroupBy(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Group by Client</SelectItem>
                  <SelectItem value="project">Group by Project</SelectItem>
                  <SelectItem value="team_member">
                    Group by Team Member
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("csv")}
                  >
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("pdf")}
                  >
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalHoursOverall()}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(
                      dateRange.to,
                      "MMM d, yyyy"
                    )}`
                  : "All time"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Entries
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.reduce((sum, group) => sum + group.entries.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Time entries recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active{" "}
                {groupBy === "client"
                  ? "Clients"
                  : groupBy === "project"
                  ? "Projects"
                  : "Team Members"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                With recorded time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Tables */}
        <div className="space-y-6">
          {reports.map((group, index) => (
            <ReportGroupTable
              key={group.id ?? `${group.label ?? "group"}-${index}`}
              group={group}
              columns={columns}
              getTotalHoursForGroup={getTotalHoursForGroup}
            />
          ))}
        </div>

        {lastPage?.pagy?.pages && lastPage.pagy.pages > 1 && (
          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <span>
              Loaded {reportPages.length} of {lastPage.pagy.pages} report pages
            </span>
            {hasNextPage && !isFetchingNextPage && (
              <span>Scroll to load more report rows</span>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div ref={loadMoreReportsRef} className="h-8 w-full" />
            )}
            {isFetchingNextPage && <span>Loading more report rows...</span>}
            {!hasNextPage && <span>All report rows loaded</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEntryReport;
