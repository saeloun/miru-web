import * as React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  X,
} from "phosphor-react";
import { i18n } from "../../i18n";

// Context to expose the current search query to cell renderers
const DataTableSearchContext = React.createContext<string>("");

/**
 * Hook to access the current DataTable search/filter query from within cell renderers.
 * Use with HighlightText to highlight matching text in table cells.
 */
export function useDataTableSearch(): string {
  return React.useContext(DataTableSearchContext);
}

interface DataTableSelectionActions<TData> {
  selectedRows: TData[];
  filteredRows: TData[];
  clearSelection: () => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  showColumnVisibility?: boolean;
  showPagination?: boolean;
  onRowClick?: (row: TData) => void;
  onFilteredRowCountChange?: (count: number) => void;
  renderSelectedRowsActions?: (
    actions: DataTableSelectionActions<TData>
  ) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showColumnVisibility = false,
  showPagination = true,
  onRowClick,
  onFilteredRowCountChange,
  renderSelectedRowsActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    ...(showPagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map(row => row.original);

  const filteredRows = table
    .getFilteredRowModel()
    .rows.map(row => row.original);

  const selectedRowCount = selectedRows.length;
  const clearSelection = () => table.resetRowSelection();

  React.useEffect(() => {
    onFilteredRowCountChange?.(filteredRows.length);
  }, [filteredRows.length, onFilteredRowCountChange]);

  return (
    <DataTableSearchContext.Provider value={globalFilter}>
      <div className="w-full">
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={event => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {selectedRowCount > 0 && (
          <div
            className="mb-3 flex flex-col gap-3 rounded-md border border-border bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            data-testid="data-table-selection-toolbar"
          >
            <span
              className="text-sm font-medium text-foreground"
              data-testid="data-table-selection-count"
            >
              {i18n.t("dataTable.rowsSelected", {
                selected: selectedRowCount,
                total: filteredRows.length,
              })}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {renderSelectedRowsActions?.({
                selectedRows,
                filteredRows,
                clearSelection,
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                {i18n.t("dataTable.clearSelection")}
              </Button>
            </div>
          </div>
        )}
        <div className="rounded-md border">
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
                    className={
                      onRowClick ? "cursor-pointer hover:bg-accent" : ""
                    }
                    onClick={event => {
                      if (!onRowClick) return;
                      const target = event.target as HTMLElement;
                      if (
                        target.closest(
                          "button, a, [role='button'], [role='menuitem'], [role='menu']"
                        )
                      ) {
                        return;
                      }
                      onRowClick(row.original);
                    }}
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
                    {i18n.t("dataTable.noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {showPagination && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {i18n.t("dataTable.rowsSelected", {
                selected: table.getFilteredSelectedRowModel().rows.length,
                total: table.getFilteredRowModel().rows.length,
              })}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <CaretDoubleLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <CaretLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  {i18n.t("dataTable.pageOf", {
                    page: table.getState().pagination.pageIndex + 1,
                    total: table.getPageCount(),
                  })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <CaretRight size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <CaretDoubleRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DataTableSearchContext.Provider>
  );
}
