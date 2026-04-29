import React, { useState, useEffect, useRef } from "react";
import Loader from "common/Loader/index";
import {
  Warning as AlertCircle,
  Calendar,
  CurrencyDollar as DollarSign,
  Download,
  CaretDown as ChevronDown,
  Calendar as CalendarIcon,
} from "@phosphor-icons/react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import axios from "../../../apis/api";
import { Button } from "../../ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { currencyFormat } from "../../../helpers/currency";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import ShareReportButton from "../ShareReportButton";
import {
  buildSearchParams,
  formatReportApiDate,
  formatReportQueryDate,
  getMultiFilterLabel,
  parseNumericListParam,
  parseReportQueryDate,
  toggleNumberListValue,
} from "../filterUtils";

interface ClientAging {
  id: number;
  name: string;
  logo: string | null;
  amount_overdue: {
    zero_to_thirty_days: number;
    thirty_one_to_sixty_days: number;
    sixty_one_to_ninety_days: number;
    ninety_plus_days: number;
    total: number;
  };
}

interface AccountsAgingData {
  report: {
    clients: ClientAging[];
    total_amount_overdue: {
      zero_to_thirty_days: number;
      thirty_one_to_sixty_days: number;
      sixty_one_to_ninety_days: number;
      ninety_plus_days: number;
      total: number;
    };
    base_currency: string;
    filter_options?: {
      clients: Array<{ id: number; name: string }>;
    };
  };
}

const accountsAgingChartConfig = {
  total: {
    label: i18n.t("reports.totalDue"),
    color: "hsl(var(--primary))",
  },
};

const AccountsAgingReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [asOfDate, setAsOfDate] = useState<Date>(
    parseReportQueryDate(searchParams.get("asOf")) || new Date()
  );

  const [selectedClients, setSelectedClients] = useState<number[]>(
    parseNumericListParam(searchParams.get("clients"))
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [displayedItems, setDisplayedItems] = useState(10);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<AccountsAgingData>({
    queryKey: ["accountsAging", asOfDate, selectedClients],
    queryFn: async () => {
      const params = new URLSearchParams({
        as_of_date: formatReportApiDate(asOfDate),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/accounts_aging?${params.toString()}`
      );

      return response.data;
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (formatType: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format: formatType,
        as_of_date: formatReportApiDate(asOfDate),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/accounts_aging/download?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `accounts_aging_${format(
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

  const agingChartData = [
    {
      label: "0-30 Days",
      total: data?.report?.total_amount_overdue?.zero_to_thirty_days || 0,
    },
    {
      label: "31-60 Days",
      total: data?.report?.total_amount_overdue?.thirty_one_to_sixty_days || 0,
    },
    {
      label: "61-90 Days",
      total: data?.report?.total_amount_overdue?.sixty_one_to_ninety_days || 0,
    },
    {
      label: "90+ Days",
      total: data?.report?.total_amount_overdue?.ninety_plus_days || 0,
    },
  ];

  useEffect(() => {
    setSearchParams(
      buildSearchParams({
        asOf: formatReportQueryDate(asOfDate),
        clients: selectedClients.length > 0 ? selectedClients.join(",") : null,
      }),
      { replace: true }
    );
  }, [asOfDate, selectedClients, setSearchParams]);

  useEffect(() => {
    const nextAsOfDate =
      parseReportQueryDate(searchParams.get("asOf")) || new Date();
    const nextClients = parseNumericListParam(searchParams.get("clients"));

    setAsOfDate(current =>
      formatReportQueryDate(current) === formatReportQueryDate(nextAsOfDate)
        ? current
        : nextAsOfDate
    );

    setSelectedClients(current =>
      current.join(",") === nextClients.join(",") ? current : nextClients
    );
  }, [searchParams]);

  const columns: ColumnDef<ClientAging>[] = [
    {
      accessorKey: "name",
      header: i18n.t("reports.clientHeader"),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "amount_overdue.total",
      header: () => (
        <div className="text-right">{i18n.t("reports.totalDue")}</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold whitespace-nowrap">
          {currencyFormat(
            data?.report?.base_currency,
            row.original.amount_overdue.total
          )}
        </div>
      ),
    },
    {
      accessorKey: "amount_overdue.zero_to_thirty_days",
      header: () => (
        <div className="text-right whitespace-nowrap">
          {i18n.t("reports.zeroToThirtyDays")}
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.zero_to_thirty_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount_overdue.thirty_one_to_sixty_days",
      header: () => (
        <div className="text-right whitespace-nowrap">
          {i18n.t("reports.thirtyOneToSixtyDays")}
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.thirty_one_to_sixty_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount_overdue.sixty_one_to_ninety_days",
      header: () => (
        <div className="text-right whitespace-nowrap">
          {i18n.t("reports.sixtyOneToNinetyDays")}
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.sixty_one_to_ninety_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount_overdue.ninety_plus_days",
      header: () => (
        <div className="text-right whitespace-nowrap">
          {i18n.t("reports.ninetyPlusDays")}
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.ninety_plus_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-900 font-bold" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
  ];

  // Slice data for infinite scroll
  const allClients = data?.report?.clients || [];
  const visibleClients = allClients.slice(0, displayedItems);

  const table = useReactTable({
    data: visibleClients,
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

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
        if (
          scrollTop + clientHeight >= scrollHeight - 100 &&
          displayedItems < allClients.length
        ) {
          setDisplayedItems(prev => Math.min(prev + 10, allClients.length));
        }
      }
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", handleScroll);

      return () => tableElement.removeEventListener("scroll", handleScroll);
    }
  }, [displayedItems, allClients.length]);

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
    <div className="space-y-6 p-4 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {i18n.t("reports.accountsAgingReport")}
          </h1>
          <p className="text-gray-600 mt-1">
            {i18n.t("reports.analysisOfOutstandingReceivables")}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* As of Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !asOfDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {i18n.t("reports.asOf", {
                  date: format(asOfDate, "LLL dd, y"),
                })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={asOfDate}
                onSelect={date => date && setAsOfDate(date)}
                initialFocus
                disabled={date => date > new Date()}
              />
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {getMultiFilterLabel(
                  i18n.t("reports.clients"),
                  selectedClients.length,
                  data?.report?.filter_options?.clients?.find(client =>
                    selectedClients.includes(client.id)
                  )?.name
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-80 w-64 overflow-y-auto"
            >
              {(data?.report?.filter_options?.clients || []).map(client => (
                <DropdownMenuCheckboxItem
                  key={client.id}
                  checked={selectedClients.includes(client.id)}
                  onCheckedChange={() =>
                    setSelectedClients(previous =>
                      toggleNumberListValue(previous, client.id)
                    )
                  }
                >
                  {client.name}
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

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {i18n.t("reports.export")}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadMutation.mutate("csv")}>
                {i18n.t("reports.exportAsCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadMutation.mutate("pdf")}>
                {i18n.t("reports.exportAsPdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ShareReportButton />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.totalDue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.total || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.zeroToThirtyDays")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-700">
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.zero_to_thirty_days || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.thirtyOneToSixtyDays")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-700">
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.thirty_one_to_sixty_days ||
                  0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.sixtyOneToNinetyDays")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-700" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-800">
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.sixty_one_to_ninety_days ||
                  0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.ninetyPlusDays")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.ninety_plus_days || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>{i18n.t("reports.agingDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={accountsAgingChartConfig}
            className="h-[320px] w-full"
          >
            <BarChart
              data={agingChartData}
              margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={value =>
                  currencyFormat(data?.report?.base_currency, Number(value))
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={value =>
                      currencyFormat(data?.report?.base_currency, Number(value))
                    }
                  />
                }
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Aging Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>{i18n.t("reports.invoiceAgingDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={tableRef}
            className="rounded-md border max-h-[600px] overflow-y-auto"
          >
            <Table>
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
                      {i18n.t("reports.noClientsWithOutstandingBalances")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Loading indicator for infinite scroll */}
          {displayedItems < allClients.length && (
            <div className="flex justify-center py-4">
              <div className="text-sm text-muted-foreground">
                {i18n.t("reports.showingOfClients", {
                  displayed: displayedItems,
                  total: allClients.length,
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsAgingReport;
