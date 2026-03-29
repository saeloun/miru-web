import { useCallback, useState } from "react";

import { Invoice, invoiceApi } from "../../services/invoiceApi";

interface UsePaginatedInvoicesResult {
  invoices: Invoice[];
  totalInvoices: number;
  summary: any;
  recentlyUpdatedInvoices: Invoice[];
  recentlyUpdatedTotalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreInvoices: boolean;
  error: string | null;
  clearError: () => void;
  loadInvoices: (options?: {
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  loadMoreInvoices: () => Promise<void>;
}

const DEFAULT_PER_PAGE = 50;

export const usePaginatedInvoices = (): UsePaginatedInvoicesResult => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [recentlyUpdatedInvoices, setRecentlyUpdatedInvoices] = useState<
    Invoice[]
  >([]);
  const [recentlyUpdatedTotalCount, setRecentlyUpdatedTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreInvoices, setHasMoreInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(
    async ({
      page = 1,
      append = false,
    }: {
      page?: number;
      append?: boolean;
    } = {}) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const response = await invoiceApi.getInvoices({
          per: DEFAULT_PER_PAGE,
          page,
        } as any);

        setInvoices(previousInvoices => {
          if (!append) return response.invoices;

          const merged = [...previousInvoices, ...response.invoices];
          const dedupedInvoices = new Map();

          merged.forEach(invoice => {
            if (!dedupedInvoices.has(invoice.id)) {
              dedupedInvoices.set(invoice.id, invoice);
            }
          });

          return Array.from(dedupedInvoices.values());
        });
        setSummary(response.summary);
        setRecentlyUpdatedInvoices(response.recentlyUpdatedInvoices || []);
        setRecentlyUpdatedTotalCount(response.recentlyUpdatedTotalCount || 0);
        setTotalInvoices(response.pagy?.total || response.invoices.length || 0);
        setCurrentPage(response.pagy?.page || page);
        setHasMoreInvoices(
          (response.pagy?.page || page) < (response.pagy?.pages || 1)
        );
        setError(null);
      } catch (err) {
        setError("Failed to load invoices");
        console.error("Error loading invoices:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  const loadMoreInvoices = useCallback(async () => {
    if (isLoadingMore || !hasMoreInvoices) return;

    await loadInvoices({ page: currentPage + 1, append: true });
  }, [currentPage, hasMoreInvoices, isLoadingMore, loadInvoices]);

  return {
    invoices,
    totalInvoices,
    summary,
    recentlyUpdatedInvoices,
    recentlyUpdatedTotalCount,
    isLoading,
    isLoadingMore,
    hasMoreInvoices,
    error,
    clearError: () => setError(null),
    loadInvoices,
    loadMoreInvoices,
  };
};
