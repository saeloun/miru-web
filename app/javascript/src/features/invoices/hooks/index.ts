// features/invoices/hooks/index.ts
// Reusable hooks for invoice operations

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { invoicesApi, Invoice, InvoiceSummary } from "../api";
import { toast } from "@/components/ui/use-toast";

// Query keys factory
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: any) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  summary: () => [...invoiceKeys.all, "summary"] as const,
  monthlyRevenue: () => [...invoiceKeys.all, "monthly-revenue"] as const,
  recentlyUpdated: () => [...invoiceKeys.all, "recently-updated"] as const,
};

// Hooks for fetching data
export function useInvoices(options?: UseQueryOptions<Invoice[]>) {
  const [searchParams] = useSearchParams();

  const filters = {
    page: Number(searchParams.get("page")) || 1,
    perPage: Number(searchParams.get("perPage")) || 10,
    status: searchParams.getAll("status"),
    clientId: searchParams.get("clientId") || undefined,
    search: searchParams.get("search") || undefined,
  };

  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoicesApi.getInvoices(filters),
    ...options,
  });
}

export function useInvoice(id: string, options?: UseQueryOptions<Invoice>) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
    ...options,
  });
}

export function useInvoiceSummary(options?: UseQueryOptions<InvoiceSummary>) {
  return useQuery({
    queryKey: invoiceKeys.summary(),
    queryFn: async () => {
      const response = await invoicesApi.getSummary();

      return response.data;
    },
    ...options,
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: invoiceKeys.monthlyRevenue(),
    queryFn: async () => {
      const response = await invoicesApi.getMonthlyRevenue();

      return response.data;
    },
  });
}

export function useRecentlyUpdatedInvoices(limit = 10) {
  return useQuery({
    queryKey: [...invoiceKeys.recentlyUpdated(), limit],
    queryFn: async () => {
      const response = await invoicesApi.getRecentlyUpdated(limit);

      return response.data;
    },
  });
}

// Hooks for mutations
export function useCreateInvoice(
  options?: UseMutationOptions<Invoice, Error, Partial<Invoice>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.createInvoice,
    onSuccess: data => {
      queryClient.invalidateQueries(invoiceKeys.lists());
      queryClient.invalidateQueries(invoiceKeys.summary());
      toast({
        title: "Invoice created",
        description: `Invoice #${data.invoiceNumber} has been created.`,
      });
    },
    onError: error => {
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
    },
    ...options,
  });
}

export function useUpdateInvoice(
  options?: UseMutationOptions<
    Invoice,
    Error,
    { id: string; data: Partial<Invoice> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => invoicesApi.updateInvoice(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(invoiceKeys.detail(variables.id));
      queryClient.invalidateQueries(invoiceKeys.lists());
      toast({
        title: "Invoice updated",
        description: `Invoice #${data.invoiceNumber} has been updated.`,
      });
    },
    ...options,
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(invoiceKeys.lists());
      queryClient.invalidateQueries(invoiceKeys.summary());
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      recipients: string[];
      subject: string;
      message: string;
    }) => invoicesApi.sendInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(invoiceKeys.detail(variables.id));
      queryClient.invalidateQueries(invoiceKeys.lists());
      toast({
        title: "Invoice sent",
        description: "The invoice has been sent successfully.",
      });
    },
  });
}

// Bulk operations
export function useBulkDeleteInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.bulkDelete,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(invoiceKeys.lists());
      queryClient.invalidateQueries(invoiceKeys.summary());
      toast({
        title: "Invoices deleted",
        description: `${variables.length} invoices have been deleted.`,
      });
    },
  });
}

export function useBulkDownloadInvoices() {
  return useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const blob = await invoicesApi.bulkDownload(invoiceIds);
      // Create download link
      const url = window.URL.createObjectURL(blob as any);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Download started",
        description: `Downloading ${variables.length} invoices...`,
      });
    },
  });
}

// Optimistic updates example
export function useOptimisticUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      invoicesApi.updateInvoice(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(invoiceKeys.detail(id));

      // Snapshot previous value
      const previousInvoice = queryClient.getQueryData(invoiceKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(invoiceKeys.detail(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousInvoice };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          invoiceKeys.detail(variables.id),
          context.previousInvoice
        );
      }

      toast({
        title: "Error updating invoice",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      // Refetch after error or success
      queryClient.invalidateQueries(invoiceKeys.detail(variables.id));
    },
  });
}
