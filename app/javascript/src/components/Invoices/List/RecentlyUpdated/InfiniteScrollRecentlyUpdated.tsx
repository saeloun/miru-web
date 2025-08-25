import React, { useState, useEffect, useRef, useCallback } from "react";
import invoicesApi from "apis/invoices";
import { Toastr } from "StyledComponents";
import RecentlyUpdatedCard from "./RecentlyUpdatedCard";

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  client: {
    name: string;
    logo?: string;
    email: string;
  };
}

interface RecentlyUpdatedProps {
  initialInvoices?: Invoice[];
}

const InfiniteScrollRecentlyUpdated: React.FC<RecentlyUpdatedProps> = ({
  initialInvoices = [],
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch invoices function
  const fetchInvoices = useCallback(
    async (pageNum: number) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await invoicesApi.getRecentlyUpdated(pageNum, 10);
        const data = response.data;

        if (pageNum === 1) {
          setInvoices(data.invoices);
        } else {
          setInvoices(prev => [...prev, ...data.invoices]);
        }

        setHasMore(data.meta.has_more);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching recently updated invoices:", err);
        setError("Failed to load invoices");
        if (pageNum === 1) {
          Toastr.error("Failed to load recently updated invoices");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Initial load
  useEffect(() => {
    if (initialInvoices.length === 0) {
      fetchInvoices(1);
    }
  }, []);

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

  // Retry function for error state
  const handleRetry = () => {
    fetchInvoices(page);
  };

  // Empty state
  if (!loading && invoices.length === 0) {
    return (
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
            Recently Updated
          </h2>
        </div>
        <div className="w-full py-8 text-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">No recently updated invoices</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
          Recently Updated
        </h2>
        {invoices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {invoices.length} loaded
            </span>
            {hasMore && (
              <span className="text-xs text-gray-400">• More available</span>
            )}
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto overflow-y-visible pb-2 -mx-1"
      >
        <div className="flex gap-0">
          {invoices.map((invoice, index) => (
            <RecentlyUpdatedCard
              key={invoice.id}
              invoice={{
                id: invoice.id,
                invoiceNumber: invoice.invoice_number,
                amount: invoice.amount,
                currency: invoice.currency,
                status: invoice.status,
                client: invoice.client,
              }}
              index={index}
            />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center mx-1.5 w-36 h-32 rounded-lg border border-gray-200 bg-gray-50 animate-pulse">
              <div className="text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#5B34EA] border-r-transparent"></div>
                <p className="mt-2 text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center justify-center mx-1.5 w-36 h-32 rounded-lg border border-red-200 bg-red-50">
              <div className="text-center p-3">
                <p className="text-xs text-red-600 mb-2">Failed to load</p>
                <button
                  onClick={handleRetry}
                  className="text-xs text-[#5B34EA] hover:underline"
                >
                  Retry
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
                <p className="text-xs text-gray-500">Scroll for more</p>
              </div>
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && invoices.length > 0 && (
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
                <p className="text-xs text-gray-500">All caught up!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfiniteScrollRecentlyUpdated;
