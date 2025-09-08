// features/invoices/routes/dashboard/actions.ts
// All mutations and actions for the dashboard

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/features/invoices/api";
import { toast } from "@/components/ui/use-toast";

// Action types
export type DashboardAction =
  | { type: "FILTER_BY_STATUS"; status: string[] }
  | { type: "FILTER_BY_CLIENT"; clientId: string }
  | { type: "FILTER_BY_DATE_RANGE"; range: { from: Date; to: Date } }
  | { type: "BULK_DELETE"; invoiceIds: string[] }
  | { type: "BULK_DOWNLOAD"; invoiceIds: string[] }
  | { type: "SEND_INVOICE"; invoiceId: string }
  | { type: "EXPORT_DATA"; format: "csv" | "pdf" | "excel" };

// Action handlers
export async function action({
  request,
  params,
}: {
  request: Request;
  params: any;
}) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "delete":
      return handleDelete(formData);
    case "bulkAction":
      return handleBulkAction(formData);
    case "filter":
      return handleFilter(formData);
    default:
      throw new Error(`Unknown intent: ${intent}`);
  }
}

async function handleDelete(formData: FormData) {
  const invoiceId = formData.get("invoiceId") as string;
  await invoicesApi.deleteInvoice(invoiceId);

  return { success: true, message: "Invoice deleted successfully" };
}

async function handleBulkAction(formData: FormData) {
  const action = formData.get("action") as string;
  const invoiceIds = formData.getAll("invoiceIds") as string[];

  switch (action) {
    case "delete":
      await invoicesApi.bulkDelete(invoiceIds);

      return {
        success: true,
        message: `${invoiceIds.length} invoices deleted`,
      };
    case "download":
      await invoicesApi.bulkDownload(invoiceIds);

      return { success: true, message: "Download started" };
    default:
      throw new Error(`Unknown bulk action: ${action}`);
  }
}

async function handleFilter(formData: FormData) {
  // Return filter params to update URL
  return {
    redirectTo: `?${new URLSearchParams(formData as any).toString()}`,
  };
}

// React hooks for mutations
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => invoicesApi.deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      toast({
        title: "Invoice deleted",
        description: "The invoice has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });
}

export function useBulkActions() {
  const queryClient = useQueryClient();

  return {
    bulkDelete: useMutation({
      mutationFn: (invoiceIds: string[]) => invoicesApi.bulkDelete(invoiceIds),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["invoices"]);
        toast({
          title: "Invoices deleted",
          description: `${variables.length} invoices have been deleted.`,
        });
      },
    }),

    bulkDownload: useMutation({
      mutationFn: (invoiceIds: string[]) =>
        invoicesApi.bulkDownload(invoiceIds),
      onSuccess: (_, variables) => {
        toast({
          title: "Download started",
          description: `Downloading ${variables.length} invoices...`,
        });
      },
    }),

    bulkSend: useMutation({
      mutationFn: (invoiceIds: string[]) => invoicesApi.bulkSend(invoiceIds),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["invoices"]);
        toast({
          title: "Invoices sent",
          description: `${variables.length} invoices have been sent.`,
        });
      },
    }),
  };
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      recipients,
      subject,
      message,
    }: {
      invoiceId: string;
      recipients: string[];
      subject: string;
      message: string;
    }) => invoicesApi.sendInvoice(invoiceId, { recipients, subject, message }),

    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      toast({
        title: "Invoice sent",
        description: "The invoice has been sent successfully.",
      });
    },
  });
}
