import React, { useState, useEffect, useRef, useCallback } from "react";

import RecentlyUpdatedCard from "./RecentlyUpdatedCard";

const RecentlyUpdated = ({ recentlyUpdatedInvoices }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollPercentage =
      (container.scrollLeft / (container.scrollWidth - container.clientWidth)) *
      100;

    // Load more when scrolled 80% to the right
    if (
      scrollPercentage > 80 &&
      visibleCount < recentlyUpdatedInvoices.length
    ) {
      setVisibleCount(prev =>
        Math.min(prev + 10, recentlyUpdatedInvoices.length)
      );
    }
  }, [visibleCount, recentlyUpdatedInvoices.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Recently Updated</h2>
        {recentlyUpdatedInvoices?.length > 0 && (
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Showing {Math.min(visibleCount, recentlyUpdatedInvoices.length)} of{" "}
            {recentlyUpdatedInvoices.length}
          </span>
        )}
      </div>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto overflow-y-visible pb-3 gap-3 scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        {recentlyUpdatedInvoices.length > 0 ? (
          <>
            {recentlyUpdatedInvoices.slice(0, visibleCount).map(invoice => (
              <RecentlyUpdatedCard invoice={invoice} key={invoice.id} />
            ))}
            {visibleCount < recentlyUpdatedInvoices.length && (
              <div className="flex items-center justify-center w-40 h-44 flex-shrink-0 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Scroll for more</p>
                  <p className="text-lg font-bold text-gray-700">
                    {recentlyUpdatedInvoices.length - visibleCount}
                  </p>
                  <p className="text-xs text-gray-500">remaining</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full py-12 text-center">
            <p className="text-base text-gray-500">
              No recently updated invoices
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyUpdated;
