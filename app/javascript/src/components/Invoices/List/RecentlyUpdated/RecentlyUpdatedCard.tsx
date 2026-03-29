import React from "react";
import { format } from "date-fns";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  PaperPlaneTilt,
  Eye,
  Warning,
  FileText,
  Clock,
} from "phosphor-react";

const RecentlyUpdatedCard = ({
  invoice: { client, currency, id, invoiceNumber, amount, status, updatedAt },
}) => {
  const navigate = useNavigate();

  const formattedUpdatedAt = updatedAt
    ? format(new Date(updatedAt), "MMM dd, h:mm a")
    : null;

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
      data-testid="recently-updated-card"
      className="group flex min-h-[13.5rem] w-full cursor-pointer flex-col rounded-2xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/30 hover:shadow-lg lg:w-[18rem] lg:flex-shrink-0"
      onClick={() => navigate(`/invoices/${id}`)}
    >
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <p
            className="truncate pr-2 text-sm font-bold tracking-wide text-foreground"
            title={invoiceNumber}
          >
            {invoiceNumber}
          </p>
          {getStatusIcon()}
        </div>
      </div>

      <div className="mb-auto space-y-2">
        <p
          className="truncate text-base font-medium text-muted-foreground"
          title={client.name}
        >
          {client.name}
        </p>
        {formattedUpdatedAt && (
          <p className="truncate text-sm text-muted-foreground">
            Updated {formattedUpdatedAt}
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Amount
        </p>
        <p className="text-2xl font-bold leading-none text-foreground">
          {currencyFormat(currency, amount)}
        </p>
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
