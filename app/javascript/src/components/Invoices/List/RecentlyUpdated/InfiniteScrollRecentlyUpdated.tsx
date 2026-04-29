import React, { useState, useEffect, useRef, useCallback } from "react";
import { invoicesApi } from "apis/api";
import { Toastr } from "StyledComponents";
import RecentlyUpdatedCard from "./RecentlyUpdatedCard";
import { i18n } from "../../../../i18n";

interface Invoice {
  id: number | string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  updatedAt?: string;
  client: {
    name: string;
    logo?: string;
    email: string;
  };
}

interface RecentlyUpdatedProps {
  initialInvoices?: Invoice[];
  initialTotalCount?: number;
  disableAutoFetch?: boolean;
}

const compareInvoicesByUpdatedAt = (left: Invoice, right: Invoice) => {
  const leftTimestamp = new Date(left.updatedAt || 0).getTime();
  const rightTimestamp = new Date(right.updatedAt || 0).getTime();

  if (rightTimestamp !== leftTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return Number(right.id) - Number(left.id);
};

const InfiniteScrollRecentlyUpdated: React.FC<RecentlyUpdatedProps> = ({
  initialInvoices = [],
  initialTotalCount = 0,
  disableAutoFetch = false,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialInvoices.length >= 10);
  const [totalCount, setTotalCount] = useState(
    initialTotalCount || initialInvoices.length
  );
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const orderedInvoices = [...invoices].sort(compareInvoicesByUpdatedAt);

  useEffect(() => {
    if (initialInvoices.length === 0) return;

    setInvoices(initialInvoices);
    setTotalCount(initialTotalCount || initialInvoices.length);
    setHasMore(
      (initialTotalCount || initialInvoices.length) > initialInvoices.length
    );
    setPage(1);
  }, [initialInvoices, initialTotalCount]);

  const normalizeInvoice = useCallback(
    (invoice: any): Invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || invoice.invoice_number,
      amount: Number(invoice.amount || 0),
      currency: invoice.currency,
      status: invoice.status,
      updatedAt: invoice.updatedAt || invoice.updated_at,
      client: {
        name: invoice.client?.name || "",
        logo: invoice.client?.logo,
        email: invoice.client?.email || "",
      },
    }),
    []
  );

  // Fetch invoices function
  const fetchInvoices = useCallback(
    async (pageNum: number) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await invoicesApi.getRecentlyUpdated(pageNum, 10);
        const data = response.data;
        const nextInvoices = (data.invoices || []).map(normalizeInvoice);

        if (pageNum === 1) {
          setInvoices(nextInvoices);
        } else {
          setInvoices(prev => {
            const merged = [...prev, ...nextInvoices];
            const deduped = merged.filter(
              (invoice, index, array) =>
                array.findIndex(candidate => candidate.id === invoice.id) ===
                index
            );

            return deduped.sort(compareInvoicesByUpdatedAt);
          });
        }

        setHasMore(data.meta.has_more);
        setTotalCount(data.meta.total_count || nextInvoices.length);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching recently updated invoices:", err);
        setError(i18n.t("invoices.failedToLoad"));
        if (pageNum === 1) {
          Toastr.error(
            `${i18n.t("invoices.failedToLoad")} ${i18n
              .t("invoices.recentlyUpdated")
              .toLowerCase()}`
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, normalizeInvoice]
  );

  // Initial load
  useEffect(() => {
    if (!disableAutoFetch && initialInvoices.length === 0) {
      fetchInvoices(1);
    }
  }, [disableAutoFetch, fetchInvoices, initialInvoices.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) {
      // Fallback for environments without IntersectionObserver
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchInvoices(page + 1);
        }
      },
      {
        threshold: 0.1,
        root: scrollContainerRef.current,
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [page, hasMore, loading, fetchInvoices]);

  const handleRetry = () => {
    fetchInvoices(page);
  };

  // Empty state
  if (!loading && invoices.length === 0) {
    return (
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
            {i18n.t("invoices.recentlyUpdated")}
          </h2>
        </div>
        <div className="w-full py-8 text-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            {i18n.t("invoices.noRecentlyUpdated")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
            {i18n.t("invoices.recentlyUpdated")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {i18n.t("invoices.sortedByLatestUpdate")}
          </p>
        </div>
        {orderedInvoices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {i18n.t("invoices.showingOf", {
                shown: orderedInvoices.length,
                total: totalCount,
              })}
            </span>
            {hasMore && (
              <span className="text-xs text-gray-400">
                • {i18n.t("invoices.scrollForMore")}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto overflow-y-visible pb-3"
      >
        <div className="flex gap-3 px-1">
          {orderedInvoices.map((invoice, index) => (
            <RecentlyUpdatedCard
              key={invoice.id}
              invoice={invoice}
              index={index}
            />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center mx-1.5 w-36 h-32 rounded-lg border border-gray-200 bg-gray-50 animate-pulse">
              <div className="text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#5E58F1] border-r-transparent"></div>
                <p className="mt-2 text-xs text-gray-500">
                  {i18n.t("loading")}
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center justify-center mx-1.5 w-36 h-32 rounded-lg border border-red-200 bg-red-50">
              <div className="text-center p-3">
                <p className="text-xs text-red-600 mb-2">
                  {i18n.t("invoices.failedToLoad")}
                </p>
                <button
                  onClick={handleRetry}
                  className="text-xs text-[#5E58F1] hover:underline"
                >
                  {i18n.t("common.retry")}
                </button>
              </div>
            </div>
          )}

          {/* Intersection observer target */}
          {hasMore && !loading && !error && (
            <div
              ref={observerTarget}
              className="flex items-center justify-center mx-1.5 w-36 h-32 rounded-lg border border-dashed border-gray-300 bg-gradient-to-r from-gray-50 to-white"
            >
              <div className="text-center">
                <svg
                  className="w-6 h-6 text-gray-400 mx-auto mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <p className="text-xs text-gray-500">
                  {i18n.t("invoices.scrollForMore")}
                </p>
              </div>
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && orderedInvoices.length > 0 && (
            <div className="flex items-center justify-center mx-1.5 w-36 h-32 rounded-lg border border-gray-200 bg-gray-50">
              <div className="text-center p-3">
                <svg
                  className="w-6 h-6 text-green-500 mx-auto mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-xs text-gray-500">
                  {i18n.t("invoices.allCaughtUp")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfiniteScrollRecentlyUpdated;
