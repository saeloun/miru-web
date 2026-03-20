import React from "react";
import {
  CheckCircle,
  Clock,
  PaperPlaneTilt,
  Eye,
  Warning,
  XCircle,
  CurrencyDollar,
  FileText,
  ArrowsCounterClockwise,
  Prohibit,
  CircleNotch,
  ArrowCircleDown,
} from "phosphor-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusConfig = (statusText: string) => {
    const normalizedStatus = statusText.toLowerCase().replace(/\s+/g, "_");

    const statusConfigs = {
      // Invoice statuses
      draft: {
        icon: <FileText size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-foreground",
        label: "Draft",
      },
      sent: {
        icon: <PaperPlaneTilt size={12} weight="bold" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Sent",
      },
      viewed: {
        icon: <Eye size={12} weight="bold" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Viewed",
      },
      paid: {
        icon: <CheckCircle size={12} weight="bold" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Paid",
      },
      overdue: {
        icon: <Warning size={12} weight="bold" />,
        bg: "border-destructive/40 bg-destructive/10",
        text: "text-destructive",
        label: "Overdue",
      },
      pending: {
        icon: <Clock size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-foreground",
        label: "Pending",
      },

      // Payment statuses
      completed: {
        icon: <CheckCircle size={12} weight="bold" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Completed",
      },
      partially_paid: {
        icon: <ArrowCircleDown size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-foreground",
        label: "Partial",
      },
      failed: {
        icon: <XCircle size={12} weight="bold" />,
        bg: "border-destructive/40 bg-destructive/10",
        text: "text-destructive",
        label: "Failed",
      },
      refunded: {
        icon: <ArrowsCounterClockwise size={12} weight="bold" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Refunded",
      },
      processing: {
        icon: <CircleNotch size={12} weight="bold" className="animate-spin" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Processing",
      },
      cancelled: {
        icon: <Prohibit size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-muted-foreground",
        label: "Cancelled",
      },

      // Billing statuses
      billed: {
        icon: <CurrencyDollar size={12} weight="bold" />,
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Billed",
      },
      unbilled: {
        icon: <Clock size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-foreground",
        label: "Unbilled",
      },
      waived: {
        icon: <Prohibit size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-muted-foreground",
        label: "Waived",
      },
      declined: {
        icon: <XCircle size={12} weight="bold" />,
        bg: "border-destructive/40 bg-destructive/10",
        text: "text-destructive",
        label: "Declined",
      },
      sending: {
        icon: (
          <PaperPlaneTilt size={12} weight="bold" className="animate-pulse" />
        ),
        bg: "border-border bg-card",
        text: "text-foreground",
        label: "Sending",
      },
      nonbilled: {
        icon: <FileText size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-muted-foreground",
        label: "Non-billed",
      },
      non_billable: {
        icon: <Prohibit size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-muted-foreground",
        label: "Non-billable",
      },
    };

    return (
      statusConfigs[normalizedStatus] || {
        icon: <Warning size={12} weight="bold" />,
        bg: "border-border bg-muted",
        text: "text-foreground",
        label: statusText,
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${config.bg} ${config.text} ${className}`}
    >
      {config.icon}
      <span className="uppercase tracking-wider">{config.label || status}</span>
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;
