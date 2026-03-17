import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  PaperPlaneTilt,
  Eye,
  Warning,
  FileText,
  Clock,
  ArrowUpRight,
} from "phosphor-react";

const RecentlyUpdatedCard = ({
  invoice: { client, currency, id, invoiceNumber, amount, status },
}) => {
  const navigate = useNavigate();

  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />;
      case "sent":
        return (
          <PaperPlaneTilt className="w-4 h-4 text-blue-600" weight="fill" />
        );
      case "viewed":
        return <Eye className="w-4 h-4 text-cyan-600" weight="fill" />;
      case "overdue":
        return <Warning className="w-4 h-4 text-red-600" weight="fill" />;
      case "draft":
        return <FileText className="w-4 h-4 text-gray-500" weight="fill" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" weight="fill" />;
    }
  };

  return (
    <div
      className="group flex h-44 w-full cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/30 hover:shadow-lg lg:w-40 lg:flex-shrink-0"
      onClick={() => navigate(`/invoices/${id}`)}
    >
      {/* Invoice number with status icon */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p
            className="truncate text-sm font-bold text-foreground"
            title={invoiceNumber}
          >
            {invoiceNumber}
          </p>
          {getStatusIcon()}
        </div>
      </div>

      <div className="mb-auto">
        <p
          className="truncate text-sm font-medium text-muted-foreground"
          title={client.name}
        >
          {client.name}
        </p>
      </div>

      {/* Amount at bottom */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p className="text-base font-bold text-foreground">
              {currencyFormat(currency, amount)}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
