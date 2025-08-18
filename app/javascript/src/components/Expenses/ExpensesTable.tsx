import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Plus,
  DotsThree,
  PencilSimple,
  Trash,
  Receipt,
  CurrencyDollar,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUp,
  ArrowDown,
  Upload,
  FileText,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import expensesApi from "../../apis/expenses";
import { currencyFormat } from "../../helpers/currency";
import { toast } from "sonner";

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  project?: string;
  status: "pending" | "approved" | "rejected";
  receipts?: string[];
  notes?: string;
  expenseType: "billable" | "non-billable";
  createdBy: string;
  createdAt: string;
}

interface ExpensesData {
  expenses: Expense[];
  categories: string[];
  vendors: string[];
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
}

const fetchExpenses = async (filter: string = "all"): Promise<ExpensesData> => {
  const response = await expensesApi.index(filter !== "all" ? `status=${filter}` : "");
  
  // Transform the response to match our interface
  const expenses = response.data.expenses || [];
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === "approved").reduce((sum, e) => sum + e.amount, 0);
  
  return {
    expenses,
    categories: response.data.categories || [],
    vendors: response.data.vendors || [],
    totalAmount,
    pendingAmount,
    approvedAmount,
  };
};

const ExpensesTable: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdminUser, company } = useUserContext();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => fetchExpenses("all"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await expensesApi.destroy(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
  });

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditDialog(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedExpense) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
            <CheckCircle size={12} className="mr-1" weight="fill" />
            <span className="text-xs font-medium">Approved</span>
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            <XCircle size={12} className="mr-1" weight="fill" />
            <span className="text-xs font-medium">Rejected</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
            <Clock size={12} className="mr-1" weight="fill" />
            <span className="text-xs font-medium">Pending</span>
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "billable" ? (
      <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">Billable</Badge>
    ) : (
      <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">Non-billable</Badge>
    );
  };

  const baseCurrency = company?.baseCurrency || "USD";

  const columns: ColumnDef<Expense>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Date</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={14} className="ml-1" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={14} className="ml-1" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return (
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">
              {date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Description</span>,
      cell: ({ row }) => {
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">{row.original.description}</p>
            {row.original.notes && (
              <p className="text-xs text-gray-500 truncate max-w-xs mt-1">
                {row.original.notes}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: () => <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Category</span>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700">{row.original.category}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "vendor",
      header: () => <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Vendor</span>,
      cell: ({ row }) => {
        return (
          <span className="text-sm text-gray-600">
            {row.original.vendor || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={14} className="ml-1" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={14} className="ml-1" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-sm font-semibold text-gray-900">
            {currencyFormat(baseCurrency, row.original.amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "expenseType",
      header: () => <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Type</span>,
      cell: ({ row }) => {
        return getTypeBadge(row.original.expenseType);
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Status</span>,
      cell: ({ row }) => {
        return getStatusBadge(row.original.status);
      },
    },
    {
      id: "receipts",
      header: () => <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Receipts</span>,
      cell: ({ row }) => {
        const receipts = row.original.receipts || [];
        if (receipts.length === 0) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <FileText size={16} className="mr-1" />
            {receipts.length}
          </Button>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const expense = row.original;

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
                onClick={() => navigator.clipboard.writeText(expense.id)}
              >
                Copy expense ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}`)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                <PencilSimple size={16} className="mr-2" />
                Edit expense
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(expense)}
                className="text-red-600"
              >
                <Trash size={16} className="mr-2" />
                Delete expense
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
          <Receipt size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Failed to load expenses</p>
        </div>
      </div>
    );
  }

  const expenses = data?.expenses || [];
  const totalAmount = data?.totalAmount || 0;
  const pendingAmount = data?.pendingAmount || 0;
  const approvedAmount = data?.approvedAmount || 0;
  const rejectedAmount = totalAmount - pendingAmount - approvedAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track and manage your business expenses
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                <Upload size={16} className="mr-2" />
                Import
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                size="sm"
              >
                <Plus size={16} className="mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Expenses</CardTitle>
            <CurrencyDollar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {currencyFormat(baseCurrency, totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
            <Clock size={20} className="text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {currencyFormat(baseCurrency, pendingAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Approved</CardTitle>
            <CheckCircle size={20} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {currencyFormat(baseCurrency, approvedAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready to reimburse</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">This Month</CardTitle>
            <Calendar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {expenses.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Expense entries</p>
          </CardContent>
        </Card>
      </div>


        {/* Data Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">All Expenses</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              View and manage all expense entries with their approval status
            </CardDescription>
          </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <DataTable
              columns={columns}
              data={expenses}
              searchPlaceholder="Search expenses..."
            />
          ) : (
            <div className="text-center py-12">
              <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No expenses recorded</p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Add Your First Expense
                </Button>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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

export default ExpensesTable;