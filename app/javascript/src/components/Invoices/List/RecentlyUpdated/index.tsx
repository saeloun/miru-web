import React, { useState, useEffect, useRef, useCallback } from "react";

import RecentlyUpdatedCard from "./RecentlyUpdatedCard";
import { i18n } from "../../../../i18n";

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
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">{i18n.t("invoices.recentlyUpdated")}</h2>
        {recentlyUpdatedInvoices?.length > 0 && (
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {i18n.t("invoices.showingOf", { shown: Math.min(visibleCount, recentlyUpdatedInvoices.length), total: recentlyUpdatedInvoices.length })}
          </span>
        )}
      </div>
      <div
        ref={scrollContainerRef}
        className="grid grid-cols-1 gap-3 pb-3 sm:grid-cols-2 lg:flex lg:overflow-x-auto lg:overflow-y-visible lg:scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        {recentlyUpdatedInvoices.length > 0 ? (
          <>
            {recentlyUpdatedInvoices.slice(0, visibleCount).map(invoice => (
              <RecentlyUpdatedCard invoice={invoice} key={invoice.id} />
            ))}
            {visibleCount < recentlyUpdatedInvoices.length && (
              <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 lg:w-40 lg:flex-shrink-0">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {i18n.t("invoices.scrollForMore")}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {recentlyUpdatedInvoices.length - visibleCount}
                  </p>
                  <p className="text-xs text-muted-foreground"></p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full py-12 text-center">
            <p className="text-base text-muted-foreground">
              {i18n.t("invoices.noRecentlyUpdated")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyUpdated;
