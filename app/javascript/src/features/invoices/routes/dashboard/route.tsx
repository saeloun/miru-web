// features/invoices/routes/dashboard/route.tsx
// This follows a feature-based structure optimized for Vite + Rails

import React from "react";
import { useDashboardData } from "./loader";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardProvider } from "./context";

export default function InvoiceDashboardRoute() {
  const { data, loading, error, refetch } = useDashboardData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  return (
    <DashboardProvider value={{ data, refetch }}>
      <DashboardLayout />
    </DashboardProvider>
  );
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 animate-pulse">
      <div className="bg-white border-b h-20" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-4 bg-white rounded-lg h-96" />
          <div className="md:col-span-3 bg-white rounded-lg h-96" />
        </div>
      </div>
    </div>
  );
}

// Error component
function DashboardError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#5B34EA] text-white rounded-lg hover:bg-[#4926D1]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
