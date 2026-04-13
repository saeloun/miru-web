import React, { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Loader from "common/Loader/index";
import useInfiniteLoadTrigger from "../../hooks/useInfiniteLoadTrigger";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DataTable } from "../ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Plus,
  DotsThree,
  PencilSimple,
  Trash,
  Receipt,
  CurrencyDollar,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  FileText,
} from "phosphor-react";
import { useUserContext } from "../../context/UserContext";
import { expensesApi } from "apis/api";
import { currencyFormat } from "../../helpers/currency";
import { toast } from "sonner";
import { i18n } from "../../i18n";
import ReceiptPreviewDialog from "./ReceiptPreviewDialog";
import { findCategoryMeta } from "./utils";

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor?: string;
  client?: string;
  project?: string;
  receipts?: string[];
  expenseType: "business" | "personal";
  status: "submitted" | "approved" | "rejected" | "paid";
  paidAt?: string | null;
  createdBy?: string;
  createdAt?: string;
}

interface ExpenseOption {
  name: string;
  label?: string;
  icon?: React.ReactNode;
  color?: string;
  iconColor?: string;
}

interface ExpensesData {
  expenses: Expense[];
  categories: ExpenseOption[];
  totalAmount: number;
  businessAmount: number;
  personalAmount: number;
  paginationDetails: {
    page: number;
    pages: number;
    total: number;
    next: number | null;
  };
}

const isCustomExpenseCategory = (
  category: string,
  categories: ExpenseOption[]
) => {
  const trimmedCategory = category.trim();

  return (
    trimmedCategory.length > 0 &&
    !categories.some(option => option.name === trimmedCategory)
  );
};

const fetchExpenses = async (
  filter: string = "all",
  page: number = 1,
  perPage: number = 25
): Promise<ExpensesData> => {
  const response = await expensesApi.index(
    [
      filter !== "all" ? `status=${filter}` : "",
      `page=${page}`,
      `per=${perPage}`,
    ]
      .filter(Boolean)
      .join("&")
  );

  const expenses = (response.data.expenses || []).map(expense => ({
    id: String(expense.id),
    date: expense.date,
    description: expense.description,
    amount: Number(expense.amount) || 0,
    category: expense.categoryName || "",
    vendor: expense.vendorName || "",
    receipts: expense.receipts || [],
    expenseType: expense.expenseType === "personal" ? "personal" : "business",
    status:
      expense.status === "paid"
        ? "paid"
        : expense.status === "approved"
        ? "approved"
        : expense.status === "rejected"
        ? "rejected"
        : "submitted",
    paidAt: expense.paidAt || null,
    createdBy: expense.submitterName || "",
  }));
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const businessAmount = expenses
    .filter(e => e.expenseType === "business")
    .reduce((sum, e) => sum + e.amount, 0);

  const personalAmount = expenses
    .filter(e => e.expenseType === "personal")
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    expenses,
    categories: response.data.categories || [],
    totalAmount,
    businessAmount,
    personalAmount,
    paginationDetails: {
      page:
        Number(
          response.data.pagy?.page || response.data.paginationDetails?.page
        ) || page,
      pages:
        Number(
          response.data.pagy?.pages || response.data.paginationDetails?.pages
        ) || 1,
      total:
        Number(
          response.data.pagy?.total || response.data.paginationDetails?.total
        ) || expenses.length,
      next:
        response.data.pagy?.next ??
        response.data.paginationDetails?.next ??
        null,
    },
  };
};

const ExpensesTable: React.FC = () => {
  const EXPENSES_BATCH_SIZE = 25;
  const queryClient = useQueryClient();
  const { company, companyRole } = useUserContext();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [visibleExpenses, setVisibleExpenses] = useState<Expense[]>([]);
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenseCount, setTotalExpenseCount] = useState(0);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    category: "",
    vendor: "",
    expenseType: "business",
    notes: "",
  });
  const [customCategorySelected, setCustomCategorySelected] = useState(false);

  const normalizeExpenseAmount = (value: string) => {
    const normalizedValue = value.replace(/[^0-9,.-]/g, "").replace(/,/g, "");

    if (
      !normalizedValue ||
      normalizedValue === "-" ||
      normalizedValue === "."
    ) {
      return value.trim();
    }

    return normalizedValue;
  };

  const hasAmount = formData.amount.trim().length > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => fetchExpenses("all", 1, EXPENSES_BATCH_SIZE),
  });

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await expensesApi.destroy(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(i18n.t("expenses.expenseDeletedSuccessfully"));
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error(i18n.t("expenses.failedToDeleteExpense"));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await expensesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(i18n.t("expenses.expenseCreatedSuccessfully"));
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error(i18n.t("expenses.failedToCreateExpense"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await expensesApi.update(id, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(i18n.t("expenses.expenseUpdatedSuccessfully"));
      setShowEditDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error(i18n.t("expenses.failedToUpdateExpense"));
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await expensesApi.markPaid(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(i18n.t("expenses.expenseMarkedAsPaid"));
    },
    onError: () => {
      toast.error(i18n.t("expenses.failedToMarkAsPaid"));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await expensesApi.approve(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(i18n.t("expenses.expenseApproved"));
    },
    onError: () => {
      toast.error(i18n.t("expenses.failedToApprove"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await expensesApi.reject(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(i18n.t("expenses.expenseRejected"));
    },
    onError: () => {
      toast.error(i18n.t("expenses.failedToReject"));
    },
  });

  const resetForm = () => {
    setCustomCategorySelected(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      category: "",
      vendor: "",
      expenseType: "business",
      notes: "",
    });
    setSelectedExpense(null);
    setReceiptFiles([]);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    // Convert date to YYYY-MM-DD format for the input field
    let dateForInput = expense.date;
    if (dateForInput && !dateForInput.includes("-")) {
      // If it's in some other format, try to parse it
      const date = new Date(dateForInput);
      dateForInput = date.toISOString().split("T")[0];
    }

    setFormData({
      date: dateForInput,
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      vendor: expense.vendor || "",
      expenseType: expense.expenseType === "personal" ? "personal" : "business",
      notes: expense.notes || "",
    });

    setCustomCategorySelected(
      isCustomExpenseCategory(expense.category, categories)
    );
    setReceiptFiles([]);
    setShowEditDialog(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteDialog(true);
  };

  const handleReceiptFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(
      file => file.size <= 2 * 1024 * 1024
    );
    setReceiptFiles(prev => [...prev, ...files].slice(0, 10));
    event.target.value = "";
  };

  const removeReceiptFile = (fileName: string) => {
    setReceiptFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const openReceiptsPreview = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowReceiptsDialog(true);
  };

  const buildExpensePayload = async () => {
    const trimmedCategory = formData.category.trim();

    if (!trimmedCategory) {
      throw new Error("invalid-category");
    }

    const payload = new FormData();

    payload.append("expense[date]", formData.date);
    payload.append("expense[description]", formData.description);
    payload.append("expense[amount]", normalizeExpenseAmount(formData.amount));
    payload.append("expense[category_name]", trimmedCategory);
    payload.append("expense[expense_type]", formData.expenseType);

    if (formData.vendor.trim()) {
      payload.append("expense[vendor_name]", formData.vendor.trim());
    }

    receiptFiles.forEach(file => {
      payload.append("expense[receipts][]", file);
    });

    return payload;
  };

  const confirmDelete = () => {
    if (selectedExpense) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };

  const handleSubmitAdd = () => {
    const submit = async () => {
      try {
        if (!formData.category.trim()) {
          toast.error(i18n.t("expenses.selectValidCategory"));

          return;
        }

        const payload = await buildExpensePayload();
        createMutation.mutate(payload);
      } catch {
        toast.error(i18n.t("expenses.failedToCreateExpense"));
      }
    };

    submit();
  };

  const handleSubmitEdit = () => {
    if (!selectedExpense) return;

    const submit = async () => {
      try {
        if (!formData.category.trim()) {
          toast.error(i18n.t("expenses.selectValidCategory"));

          return;
        }

        const payload = await buildExpensePayload();
        updateMutation.mutate({
          id: selectedExpense.id,
          data: payload,
        });
      } catch {
        toast.error(i18n.t("expenses.failedToUpdateExpense"));
      }
    };

    submit();
  };

  const getTypeBadge = (type: string) =>
    type === "business" ? (
      <Badge
        variant="outline"
        className="border-border bg-card text-xs text-card-foreground"
      >
        Business
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-border text-xs text-muted-foreground"
      >
        Personal
      </Badge>
    );

  const getStatusBadge = (status: Expense["status"]) =>
    status === "paid" ? (
      <Badge
        variant="outline"
        className="border-border bg-card text-card-foreground"
      >
        Paid
      </Badge>
    ) : status === "approved" ? (
      <Badge
        variant="outline"
        className="border-border bg-card text-card-foreground"
      >
        Approved
      </Badge>
    ) : status === "rejected" ? (
      <Badge
        variant="outline"
        className="border-border bg-card text-card-foreground"
      >
        Rejected
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-border bg-muted text-foreground"
      >
        Submitted
      </Badge>
    );

  const baseCurrency = company?.baseCurrency || "USD";
  const canManageReimbursements = ["admin", "owner", "book_keeper"].includes(
    companyRole || ""
  );
  const categories = data?.categories || [];
  const isCustomCategorySelected =
    customCategorySelected ||
    isCustomExpenseCategory(formData.category, categories);

  const selectedCategoryValue = isCustomCategorySelected
    ? "Other"
    : formData.category;

  const updateCategorySelection = (value: string) => {
    if (value === "Other") {
      setCustomCategorySelected(true);
      setFormData(current => ({
        ...current,
        category: isCustomExpenseCategory(current.category, categories)
          ? current.category
          : "",
      }));

      return;
    }

    setCustomCategorySelected(false);
    setFormData(current => ({
      ...current,
      category: value,
    }));
  };

  useEffect(() => {
    if (!data) return;

    setVisibleExpenses(data.expenses || []);
    setVisibleExpenseCount((data.expenses || []).length);
    setCurrentPage(data.paginationDetails?.page || 1);
    setTotalExpenseCount(data.paginationDetails?.total || data.expenses.length);
    setHasMoreExpenses(Boolean(data.paginationDetails?.next));
  }, [data]);

  const loadMoreExpenses = useCallback(async () => {
    if (isLoadingMore || !hasMoreExpenses) return;

    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const nextData = await fetchExpenses(
        "all",
        nextPage,
        EXPENSES_BATCH_SIZE
      );

      setVisibleExpenses(previousExpenses => {
        const mergedExpenses = [...previousExpenses, ...nextData.expenses];
        const dedupedExpenses = new Map();

        mergedExpenses.forEach(expense => {
          if (!dedupedExpenses.has(expense.id)) {
            dedupedExpenses.set(expense.id, expense);
          }
        });

        return Array.from(dedupedExpenses.values());
      });

      setVisibleExpenseCount(previousCount =>
        Math.min(
          previousCount + nextData.expenses.length,
          nextData.paginationDetails.total
        )
      );
      setCurrentPage(nextData.paginationDetails.page);
      setTotalExpenseCount(nextData.paginationDetails.total);
      setHasMoreExpenses(Boolean(nextData.paginationDetails.next));
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMoreExpenses, isLoadingMore]);

  const loadMoreExpensesRef = useInfiniteLoadTrigger({
    enabled: hasMoreExpenses,
    loading: isLoadingMore,
    onLoadMore: loadMoreExpenses,
  });

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Date
          </span>
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={14} className="ml-1" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={14} className="ml-1" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.date);

        return (
          <span className="text-sm text-foreground">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Description
        </span>
      ),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.original.description}
          </p>
          {row.original.notes && (
            <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
              {row.original.notes}
            </p>
          )}
        </div>
      ),
    },
    ...(canManageReimbursements
      ? [
          {
            accessorKey: "createdBy",
            header: () => (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Submitted by
              </span>
            ),
            cell: ({ row }: { row: { original: Expense } }) => (
              <span className="text-sm text-foreground">
                {row.original.createdBy || "—"}
              </span>
            ),
          } as ColumnDef<Expense>,
        ]
      : []),
    {
      accessorKey: "category",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Category
        </span>
      ),
      cell: ({ row }) => {
        const category = findCategoryMeta(row.original.category);

        return (
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/70 px-2.5 py-1">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{
                backgroundColor: category.color,
                color: category.iconColor,
              }}
            >
              {category.icon}
            </span>
            <span className="text-sm text-foreground">{category.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "vendor",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Vendor
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.vendor || "—"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Amount
          </span>
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={14} className="ml-1" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={14} className="ml-1" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-foreground">
          {currencyFormat(baseCurrency, row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: "expenseType",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Type
        </span>
      ),
      cell: ({ row }) => getTypeBadge(row.original.expenseType),
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Status
        </span>
      ),
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "receipts",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Receipts
        </span>
      ),
      cell: ({ row }) => {
        const receipts = row.original.receipts || [];
        if (receipts.length === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => openReceiptsPreview(row.original)}
            aria-label={`View receipts for ${row.original.description}`}
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
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`Expense actions for ${expense.description}`}
              >
                <span className="sr-only">Open menu</span>
                <DotsThree size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                <PencilSimple size={16} className="mr-2" />
                Edit expense
              </DropdownMenuItem>
              {canManageReimbursements &&
                expense.status !== "approved" &&
                expense.status !== "paid" && (
                  <DropdownMenuItem
                    onClick={() => approveMutation.mutate(expense.id)}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Approve expense
                  </DropdownMenuItem>
                )}
              {canManageReimbursements &&
                expense.status !== "rejected" &&
                expense.status !== "paid" && (
                  <DropdownMenuItem
                    onClick={() => rejectMutation.mutate(expense.id)}
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject expense
                  </DropdownMenuItem>
                )}
              {canManageReimbursements && expense.status === "approved" && (
                <DropdownMenuItem
                  onClick={() => markPaidMutation.mutate(expense.id)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Mark as paid
                </DropdownMenuItem>
              )}
              {expense.status !== "paid" && (
                <DropdownMenuItem
                  onClick={() => handleDelete(expense)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash size={16} className="mr-2" />
                  Delete expense
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <Loader className="h-96" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Receipt size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Failed to load expenses</p>
        </div>
      </div>
    );
  }

  const expenses = visibleExpenses;
  const totalAmount = data?.totalAmount || 0;
  const businessAmount = data?.businessAmount || 0;
  const personalAmount = data?.personalAmount || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mt-1 text-sm text-muted-foreground">
                Track and manage your business expenses
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus size={16} className="mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <CurrencyDollar size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {currencyFormat(baseCurrency, totalAmount)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Business
              </CardTitle>
              <CheckCircle size={20} className="text-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {currencyFormat(baseCurrency, businessAmount)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Business expenses
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Personal
              </CardTitle>
              <XCircle size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {currencyFormat(baseCurrency, personalAmount)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Personal expenses
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <Calendar size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {totalExpenseCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Expense entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="border-0 shadow-sm">
          <CardContent>
            {expenses.length > 0 ? (
              <>
                <DataTable
                  columns={columns}
                  data={expenses}
                  searchPlaceholder="Search expenses..."
                  showPagination={false}
                />
                <div className="flex flex-col items-center gap-2 pb-2 pt-4 text-sm text-muted-foreground">
                  <span>
                    Showing {visibleExpenseCount} of {totalExpenseCount}
                  </span>
                  {hasMoreExpenses && !isLoadingMore && (
                    <span>Scroll to load more expenses</span>
                  )}
                  {hasMoreExpenses && !isLoadingMore && (
                    <div ref={loadMoreExpensesRef} className="h-8 w-full" />
                  )}
                  {isLoadingMore && <span>Loading more expenses...</span>}
                  {!hasMoreExpenses && totalExpenseCount > 0 && (
                    <span>All expenses loaded</span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Receipt
                  size={48}
                  className="mx-auto mb-4 text-muted-foreground/70"
                />
                <p className="mb-4 text-muted-foreground">
                  No expenses recorded
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Submit your first expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Enter the details for the new expense.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter expense description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={e =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={selectedCategoryValue}
                onValueChange={updateCategorySelection}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.name} value={category.name}>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: findCategoryMeta(category.name)
                              .color,
                            color: findCategoryMeta(category.name).iconColor,
                          }}
                        >
                          {findCategoryMeta(category.name).icon}
                        </span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCategoryValue === "Other" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="custom-category" className="text-right">
                  Custom Category
                </Label>
                <Input
                  id="custom-category"
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter custom category"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor" className="text-right">
                Vendor
              </Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={e =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter vendor name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.expenseType}
                onValueChange={value =>
                  setFormData({ ...formData, expenseType: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="col-span-3"
                placeholder="Optional notes"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="receipts" className="pt-2 text-right">
                Receipts
              </Label>
              <div className="col-span-3 space-y-3">
                <Input
                  id="receipts"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleReceiptFiles}
                />
                {receiptFiles.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                    {receiptFiles.map(file => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate text-foreground">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeReceiptFile(file.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={
                !formData.description ||
                !hasAmount ||
                !formData.category ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Date
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={e =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter expense description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="edit-amount"
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={e =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select
                value={selectedCategoryValue}
                onValueChange={updateCategorySelection}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.name} value={category.name}>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: findCategoryMeta(category.name)
                              .color,
                            color: findCategoryMeta(category.name).iconColor,
                          }}
                        >
                          {findCategoryMeta(category.name).icon}
                        </span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCategoryValue === "Other" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-custom-category" className="text-right">
                  Custom Category
                </Label>
                <Input
                  id="edit-custom-category"
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter custom category"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-vendor" className="text-right">
                Vendor
              </Label>
              <Input
                id="edit-vendor"
                value={formData.vendor}
                onChange={e =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter vendor name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.expenseType}
                onValueChange={value =>
                  setFormData({ ...formData, expenseType: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="col-span-3"
                placeholder="Optional notes"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-receipts" className="pt-2 text-right">
                Receipts
              </Label>
              <div className="col-span-3 space-y-3">
                {selectedExpense?.receipts?.length ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openReceiptsPreview(selectedExpense)}
                  >
                    View existing receipts ({selectedExpense.receipts.length})
                  </Button>
                ) : null}
                <Input
                  id="edit-receipts"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleReceiptFiles}
                />
                {receiptFiles.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                    {receiptFiles.map(file => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate text-foreground">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeReceiptFile(file.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={
                !formData.description ||
                !hasAmount ||
                !formData.category ||
                updateMutation.isPending
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
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

      <ReceiptPreviewDialog
        open={showReceiptsDialog}
        onOpenChange={setShowReceiptsDialog}
        expense={selectedExpense}
      />
    </div>
  );
};

export default ExpensesTable;
