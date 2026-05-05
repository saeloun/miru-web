import React, { useEffect, useMemo, useState } from "react";
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { useSearchParams } from "react-router-dom";
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
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { i18n } from "../../../i18n";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarComponent } from "../../ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import ShareReportButton from "../ShareReportButton";
import ViewInAnalyticsButton from "../ViewInAnalyticsButton";
import {
  buildSearchParams,
  formatReportApiDate,
  formatReportQueryDate,
  getMultiFilterLabel,
  parseNumericListParam,
  parseReportQueryDate,
  toggleNumberListValue,
} from "../filterUtils";

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
            <span className="text-sm text-muted-foreground">
              {i18n.t("reports.totalLabel")}
            </span>
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
                    {i18n.t("reports.noResults")}
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

const resolveTimeEntryPreset = (preset: string) => {
  const now = new Date();

  switch (preset) {
    case "last_month": {
      const lastMonth = subDays(startOfMonth(now), 1);

      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    }
    case "this_quarter":
      return {
        from: startOfQuarter(now),
        to: endOfQuarter(now),
      };
    case "this_year":
      return {
        from: startOfYear(now),
        to: endOfYear(now),
      };
    case "last_7_days":
      return {
        from: subDays(now, 7),
        to: now,
      };
    case "last_30_days":
      return {
        from: subDays(now, 30),
        to: now,
      };
    case "custom":
      return undefined;
    case "this_month":
    default:
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      };
  }
};

const timeEntryChartConfig = {
  duration: {
    label: "Hours",
    color: "hsl(var(--primary))",
  },
};

const TimeEntryReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPreset = searchParams.get("preset") || "this_month";
  const initialFrom = parseReportQueryDate(searchParams.get("from"));
  const initialTo = parseReportQueryDate(searchParams.get("to"));
  const [groupBy, setGroupBy] = useState<"client" | "project" | "team_member">(
    (searchParams.get("groupBy") as "client" | "project" | "team_member") ||
      "client"
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialFrom || initialTo
      ? { from: initialFrom, to: initialTo || initialFrom }
      : resolveTimeEntryPreset(initialPreset)
  );
  const [dateRangePreset, setDateRangePreset] = useState(initialPreset);
  const [selectedClients, setSelectedClients] = useState<number[]>(
    parseNumericListParam(searchParams.get("clients"))
  );

  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>(
    parseNumericListParam(searchParams.get("teamMembers"))
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const buildTimeEntryReportParams = (
    extraParams: Record<string, string | number> = {}
  ) => {
    const params = new URLSearchParams();

    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });

    params.set("group_by", groupBy);

    if (dateRange?.from) {
      params.set("date_range", "custom");
      params.set("from", formatReportApiDate(dateRange.from) || "");
      params.set(
        "to",
        formatReportApiDate(dateRange.to || dateRange.from) || ""
      );
    } else if (dateRangePreset) {
      params.set("date_range", dateRangePreset);
    }

    selectedClients.forEach(clientId => {
      params.append("client[]", String(clientId));
    });

    selectedTeamMembers.forEach(teamMemberId => {
      params.append("team_member[]", String(teamMemberId));
    });

    return params;
  };

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
      const params = buildTimeEntryReportParams({
        page: String(pageParam),
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
  const filterOptions = lastPage?.filterOptions;
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

  const durationChartData = useMemo(() => {
    const rawDurations = lastPage?.groupByTotalDuration?.groupedDurations || {};

    return reports
      .map(group => ({
        label: group.label,
        duration: rawDurations[group.id] || 0,
      }))
      .filter(group => group.duration > 0)
      .sort((left, right) => right.duration - left.duration)
      .slice(0, 8);
  }, [lastPage?.groupByTotalDuration?.groupedDurations, reports]);

  const analyticsUrl = useMemo(() => {
    const params = buildSearchParams({
      preset: dateRangePreset,
      from: formatReportQueryDate(dateRange?.from),
      to: formatReportQueryDate(dateRange?.to),
      members:
        selectedTeamMembers.length > 0
          ? selectedTeamMembers.join(",")
          : undefined,
    });

    const queryString = params.toString();

    return queryString ? `/analytics/team?${queryString}` : "/analytics/team";
  }, [dateRange?.from, dateRange?.to, dateRangePreset, selectedTeamMembers]);

  useEffect(() => {
    setSearchParams(
      buildSearchParams({
        preset: dateRangePreset,
        groupBy,
        from: formatReportQueryDate(dateRange?.from),
        to: formatReportQueryDate(dateRange?.to),
        clients: selectedClients.length > 0 ? selectedClients.join(",") : null,
        teamMembers:
          selectedTeamMembers.length > 0 ? selectedTeamMembers.join(",") : null,
      }),
      { replace: true }
    );
  }, [
    dateRange?.from,
    dateRange?.to,
    dateRangePreset,
    groupBy,
    selectedClients,
    selectedTeamMembers,
    setSearchParams,
  ]);

  useEffect(() => {
    const nextPreset = searchParams.get("preset") || "this_month";
    const nextFrom = parseReportQueryDate(searchParams.get("from"));
    const nextTo = parseReportQueryDate(searchParams.get("to"));
    const nextGroupBy =
      (searchParams.get("groupBy") as "client" | "project" | "team_member") ||
      "client";
    const nextClients = parseNumericListParam(searchParams.get("clients"));
    const nextTeamMembers = parseNumericListParam(
      searchParams.get("teamMembers")
    );

    const nextDateRange =
      nextFrom || nextTo
        ? { from: nextFrom, to: nextTo || nextFrom }
        : resolveTimeEntryPreset(nextPreset);

    setGroupBy(current => (current === nextGroupBy ? current : nextGroupBy));
    setDateRangePreset(current =>
      current === nextPreset ? current : nextPreset
    );

    setDateRange(current => {
      const currentFrom = formatReportQueryDate(current?.from);
      const currentTo = formatReportQueryDate(current?.to);
      const nextFromString = formatReportQueryDate(nextDateRange?.from);
      const nextToString = formatReportQueryDate(nextDateRange?.to);

      if (currentFrom === nextFromString && currentTo === nextToString) {
        return current;
      }

      return nextDateRange;
    });

    setSelectedClients(current =>
      current.join(",") === nextClients.join(",") ? current : nextClients
    );

    setSelectedTeamMembers(current =>
      current.join(",") === nextTeamMembers.join(",")
        ? current
        : nextTeamMembers
    );
  }, [searchParams]);

  const loadMoreReportsRef = useInfiniteLoadTrigger({
    enabled: Boolean(hasNextPage),
    loading: isFetchingNextPage,
    onLoadMore: () => {
      fetchNextPage();
    },
  });

  const handleDateRangePreset = (preset: string) => {
    setDateRangePreset(preset);
    setDateRange(resolveTimeEntryPreset(preset));
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
      const params = buildTimeEntryReportParams({
        format: formatType,
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
      header: i18n.t("reports.dateHeader"),
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
      header: i18n.t("reports.teamMemberHeader"),
      cell: ({ row }) =>
        row.original.teamMember ||
        row.getValue("teamMember") ||
        i18n.t("reports.unknownUser"),
    },
    {
      accessorKey: "project",
      header: i18n.t("reports.projectHeader"),
      cell: ({ row }) =>
        row.original.project ||
        row.getValue("project") ||
        i18n.t("reports.unknownProject"),
    },
    {
      accessorKey: "note",
      header: i18n.t("reports.noteColumnHeader"),
    },
    {
      accessorKey: "duration",
      header: () => (
        <div className="text-right">{i18n.t("reports.hoursHeader")}</div>
      ),
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
        {i18n.t("reports.errorLoadingReportData")}
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
                {i18n.t("reports.timeReports")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {i18n.t("reports.reviewHoursLogged")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              {/* Date Range Preset Selector */}
              <Select
                value={dateRangePreset}
                onValueChange={handleDateRangePreset}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={i18n.t("selectPeriod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">
                    {i18n.t("thisMonth")}
                  </SelectItem>
                  <SelectItem value="last_month">
                    {i18n.t("lastMonth")}
                  </SelectItem>
                  <SelectItem value="this_quarter">
                    {i18n.t("thisQuarter")}
                  </SelectItem>
                  <SelectItem value="this_year">
                    {i18n.t("thisYear")}
                  </SelectItem>
                  <SelectItem value="last_7_days">
                    {i18n.t("reports.lastSevenDaysPreset")}
                  </SelectItem>
                  <SelectItem value="last_30_days">
                    {i18n.t("reports.lastThirtyDaysPreset")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {i18n.t("customRange")}
                  </SelectItem>
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
                      <span>{i18n.t("pickADateRange")}</span>
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
                      setDateRange(
                        range?.from && !range.to
                          ? { from: range.from, to: range.from }
                          : range
                      );
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
                  <SelectValue placeholder={i18n.t("reports.groupBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">
                    {i18n.t("reports.groupByClient")}
                  </SelectItem>
                  <SelectItem value="project">
                    {i18n.t("reports.groupByProject")}
                  </SelectItem>
                  <SelectItem value="team_member">
                    {i18n.t("reports.teamMembers")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    {getMultiFilterLabel(
                      "Clients",
                      selectedClients.length,
                      filterOptions?.clients?.find(option =>
                        selectedClients.includes(option.value)
                      )?.label
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-80 w-64 overflow-y-auto"
                >
                  {filterOptions?.clients?.map(client => (
                    <DropdownMenuCheckboxItem
                      key={client.value}
                      checked={selectedClients.includes(client.value)}
                      onCheckedChange={() =>
                        setSelectedClients(previous =>
                          toggleNumberListValue(previous, client.value)
                        )
                      }
                    >
                      {client.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {selectedClients.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedClients([])}>
                        Clear clients
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    {getMultiFilterLabel(
                      "Team members",
                      selectedTeamMembers.length,
                      filterOptions?.teamMembers?.find(option =>
                        selectedTeamMembers.includes(option.value)
                      )?.label
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-80 w-64 overflow-y-auto"
                >
                  {filterOptions?.teamMembers?.map(teamMember => (
                    <DropdownMenuCheckboxItem
                      key={teamMember.value}
                      checked={selectedTeamMembers.includes(teamMember.value)}
                      onCheckedChange={() =>
                        setSelectedTeamMembers(previous =>
                          toggleNumberListValue(previous, teamMember.value)
                        )
                      }
                    >
                      {teamMember.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {selectedTeamMembers.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSelectedTeamMembers([])}
                      >
                        Clear team members
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    {i18n.t("reports.export")}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("csv")}
                  >
                    {i18n.t("reports.exportAsCsv")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("pdf")}
                  >
                    {i18n.t("reports.exportAsPdf")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ViewInAnalyticsButton to={analyticsUrl} />

              <ShareReportButton />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {i18n.t("reports.totalHours")}
              </CardTitle>
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
                  : i18n.t("allTime")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {i18n.t("reports.totalEntries")}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.reduce((sum, group) => sum + group.entries.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {i18n.t("reports.timeEntriesRecorded")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {groupBy === "client"
                  ? i18n.t("reports.activeClients")
                  : groupBy === "project"
                  ? i18n.t("reports.activeProjects")
                  : i18n.t("reports.activeTeamMembers")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                {i18n.t("reports.withRecordedTime")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Hours by{" "}
              {groupBy === "client"
                ? "Client"
                : groupBy === "project"
                ? "Project"
                : "Team Member"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {durationChartData.length > 0 ? (
              <ChartContainer
                config={timeEntryChartConfig}
                className="h-[320px] w-full"
              >
                <BarChart
                  data={durationChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={value => minToHHMM(Number(value))}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={value => minToHHMM(Number(value))}
                      />
                    }
                  />
                  <Bar
                    dataKey="duration"
                    radius={[0, 6, 6, 0]}
                    fill="var(--color-duration)"
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                No grouped duration data available for the selected filters.
              </p>
            )}
          </CardContent>
        </Card>

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
              {i18n.t("reports.loadedPages", {
                loaded: reportPages.length,
                total: lastPage.pagy.pages,
              })}
            </span>
            {hasNextPage && !isFetchingNextPage && (
              <span>{i18n.t("reports.scrollToLoadMoreRows")}</span>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div ref={loadMoreReportsRef} className="h-8 w-full" />
            )}
            {isFetchingNextPage && (
              <span>{i18n.t("reports.loadingMoreRows")}</span>
            )}
            {!hasNextPage && <span>{i18n.t("reports.allRowsLoaded")}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEntryReport;
