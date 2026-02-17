// features/invoices/routes/dashboard/components/DashboardLayout.tsx
// Main layout component for the dashboard

import React from "react";
import { useDashboard } from "../context";
import { Header } from "./Header";
import { StatsCards } from "./StatsCards";
import { RevenueCharts } from "./RevenueCharts";
import { InvoiceTable } from "./InvoiceTable";
import { RecentActivity } from "./RecentActivity";
import { FilterSidebar } from "./FilterSidebar";
import { BulkActions } from "./BulkActions";
import { ThemeToggle } from "@/features/invoices/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const { state, actions } = useDashboard();
  const { data, theme, selectedInvoices, filters } = state;

  if (!data) return null;

  const isAdminTheme = theme === "admin";

  return (
    <div
      className={cn(
        "min-h-screen",
        isAdminTheme ? "bg-gray-50/50" : "bg-white"
      )}
    >
      <Header
        title="Invoice Dashboard"
        subtitle="Track and manage your invoices efficiently"
        actions={
          <BulkActions
            selectedCount={selectedInvoices.size}
            onBulkDelete={() => {
              /* implement */
            }}
            onBulkDownload={() => {
              /* implement */
            }}
            onBulkSend={() => {
              /* implement */
            }}
          />
        }
      />

      <div className="flex">
        {/* Sidebar for filters */}
        <FilterSidebar
          filters={filters}
          onFilterChange={actions.setFilter}
          onClearFilters={actions.clearFilters}
          className={cn("w-64 shrink-0", isAdminTheme && "bg-white border-r")}
        />

        {/* Main content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Stats Cards */}
          <StatsCards
            summary={data.summary}
            onCardClick={status => actions.setFilter({ status: [status] })}
          />

          {/* Charts */}
          <RevenueCharts
            monthlyRevenue={data.monthlyRevenue}
            summary={data.summary}
          />

          {/* Recent Activity */}
          <RecentActivity invoices={data.recentlyUpdated} />

          {/* Invoice Table */}
          <InvoiceTable
            invoices={data.invoices}
            selectedInvoices={selectedInvoices}
            onSelectInvoice={actions.selectInvoice}
            onDeselectInvoice={actions.deselectInvoice}
            onSelectAll={actions.selectAllInvoices}
          />
        </div>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle currentTheme={theme} onThemeChange={actions.setTheme} />
    </div>
  );
}
