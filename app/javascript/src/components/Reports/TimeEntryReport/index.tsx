import React, { useState, useEffect } from "react";
import { Calendar, Clock, Users, Building2, Filter, Download, ChevronDown, CalendarIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";
import { DateRange } from "react-day-picker";
import axios from "../../../apis/api";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { cn } from "../../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarComponent } from "../../ui/calendar";

interface TimeEntry {
  id: number;
  user_id: number;
  project_id: number;
  duration: number;
  note: string;
  work_date: string;
  bill_status: string;
  user_name?: string;
  project_name?: string;
  client_name?: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState<"client" | "project" | "team_member">("client");
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

  const { data, isLoading, error, refetch } = useQuery<TimeEntryReportData>({
    queryKey: ["timeEntryReport", currentPage, groupBy, dateRange, selectedClients, selectedTeamMembers],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        group_by: groupBy,
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && { client: selectedClients.join(",") }),
        ...(selectedTeamMembers.length > 0 && { team_member: selectedTeamMembers.join(",") }),
      });
      
      const response = await axios.get(`/reports/time_entries?${params.toString()}`);
      return response.data;
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
      case "last_month":
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
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
    if (data?.groupByTotalDuration?.groupedDurations?.[group.id]) {
      return minToHHMM(data.groupByTotalDuration.groupedDurations[group.id]);
    }
    const totalMinutes = group.entries.reduce((sum, entry) => sum + entry.duration, 0);
    return minToHHMM(totalMinutes);
  };

  const getTotalHoursOverall = (): string => {
    if (!data?.reports) return "00:00";
    const totalMinutes = data.reports.reduce((total, group) => {
      const groupMinutes = group.entries.reduce((sum, entry) => sum + entry.duration, 0);
      return total + groupMinutes;
    }, 0);
    return minToHHMM(totalMinutes);
  };

  const downloadMutation = useMutation({
    mutationFn: async (format: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format,
        group_by: groupBy,
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && { client: selectedClients.join(",") }),
        ...(selectedTeamMembers.length > 0 && { team_member: selectedTeamMembers.join(",") }),
      });
      
      const response = await axios.get(`/reports/time_entries/download?${params.toString()}`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `time_entries_${format(new Date(), "yyyy-MM-dd")}.${format}`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  const columns: ColumnDef<TimeEntry>[] = [
    {
      accessorKey: "work_date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.getValue("work_date")), "MM/dd/yyyy"),
    },
    {
      accessorKey: "user_name",
      header: "Team Member",
      cell: ({ row }) => row.original.user_name || `User ${row.original.user_id}`,
    },
    {
      accessorKey: "project_name",
      header: "Project",
      cell: ({ row }) => row.original.project_name || `Project ${row.original.project_id}`,
    },
    {
      accessorKey: "note",
      header: "Note",
    },
    {
      accessorKey: "duration",
      header: () => <div className="text-right">Hours</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">{minToHHMM(row.getValue("duration"))}</div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error loading report data. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Clock className="h-6 w-6 text-indigo-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Time Entry Report</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Date Range Preset Selector */}
              <Select value={dateRangePreset} onValueChange={handleDateRangePreset}>
                <SelectTrigger className="w-[180px]">
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
                      "w-[280px] justify-start text-left font-normal",
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
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {/* Group By Selector */}
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Group by Client</SelectItem>
                  <SelectItem value="project">Group by Project</SelectItem>
                  <SelectItem value="team_member">Group by Team Member</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => downloadMutation.mutate("csv")}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadMutation.mutate("pdf")}>
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
                  ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  : "All time"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.reports?.reduce((sum, group) => sum + group.entries.length, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">Time entries recorded</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active {groupBy === "client" ? "Clients" : groupBy === "project" ? "Projects" : "Team Members"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.reports?.length || 0}</div>
              <p className="text-xs text-muted-foreground">With recorded time</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Tables */}
        <div className="space-y-6">
          {data?.reports?.map((group) => {
            const table = useReactTable({
              data: group.entries,
              columns,
              onSortingChange: setSorting,
              onColumnFiltersChange: setColumnFilters,
              getCoreRowModel: getCoreRowModel(),
              getPaginationRowModel: getPaginationRowModel(),
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
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead key={header.id}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </TableHead>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
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
          })}
        </div>

        {/* Pagination */}
        {data?.pagy && data.pagy.pages > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!data.pagy.prev}
            >
              Previous
            </Button>
            
            {[...Array(data.pagy.pages)].map((_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!data.pagy.next}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEntryReport;