import React from "react";
import { currencyFormat } from "helpers/currency";
import {
  AlertTriangle,
  Clock,
  FileText,
  ArrowCounterClockwise,
  ArrowUpRight,
} from "phosphor-react";
import { i18n } from "../../../i18n";

interface CompactInvoiceSummaryProps {
  summary: {
    overdueAmount: number | string;
    outstandingAmount: number | string;
    draftAmount: number | string;
  };
  baseCurrency: string;
  filterParams: any;
  setFilterParams: (params: any) => void;
  className?: string;
}

const CompactInvoiceSummary: React.FC<CompactInvoiceSummaryProps> = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
  className = "",
}) => {
  const applyFilter = (status: any) => {
    setFilterParams({
      ...filterParams,
      status,
    });
  };

  const resetFilters = () => {
    setFilterParams({
      ...filterParams,
      status: [],
    });
  };

  const parseAmount = (value: number | string): number => {
    if (typeof value === "number") return value;
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  };
  const overdueAmount = parseAmount(summary.overdueAmount);
  const outstandingAmount = parseAmount(summary.outstandingAmount);
  const draftAmount = parseAmount(summary.draftAmount);
  const openAmount = Math.max(outstandingAmount - overdueAmount, 0);

  const summaryItems = [
    {
      id: "all",
      label: i18n.t("invoiceDashboard.allInvoices"),
      value: overdueAmount + openAmount + draftAmount,
      icon: ArrowCounterClockwise,
      colorClass: "text-[#5E58F1]",
      bgClass: "bg-[#5E58F1]/5 hover:bg-[#5E58F1]/10 border-[#5E58F1]/20",
      onClick: resetFilters,
      isReset: true,
    },
    {
      id: "overdue",
      label: i18n.t("invoices.overdue"),
      value: overdueAmount,
      icon: AlertTriangle,
      colorClass: "text-red-600",
      bgClass: "bg-red-50 hover:bg-red-100 border-red-200",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      id: "outstanding",
      label: i18n.t("invoices.outstanding"),
      value: openAmount,
      icon: Clock,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50 hover:bg-amber-100 border-amber-200",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
        ]),
    },
    {
      id: "draft",
      label: i18n.t("invoices.draft"),
      value: draftAmount,
      icon: FileText,
      colorClass: "text-gray-600",
      bgClass: "bg-gray-50 hover:bg-gray-100 border-gray-200",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  return (
    <div className={`${className}`}>
      <div className="flex flex-col lg:flex-row gap-3">
        <h3 className="text-sm font-medium text-gray-700 lg:hidden">
          {i18n.t("invoices.invoices")}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryItems.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`${item.bgClass} rounded-lg p-3 text-left transition-all duration-200 border group relative overflow-hidden`}
              >
                {/* Hover indicator */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${item.colorClass}`} />
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        {item.label}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-semibold ${item.colorClass} truncate`}
                    >
                      {item.isReset ? (
                        <span className="text-sm">
                          {i18n.t("invoices.resetFilters")}
                        </span>
                      ) : (
                        currencyFormat(baseCurrency, item.value)
                      )}
                    </p>
                  </div>
                  <ArrowUpRight
                    className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${item.colorClass}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompactInvoiceSummary;
