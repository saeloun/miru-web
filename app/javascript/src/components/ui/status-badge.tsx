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
        bg: "bg-gray-500",
        text: "text-white",
        label: "Draft",
      },
      sent: {
        icon: <PaperPlaneTilt size={12} weight="bold" />,
        bg: "bg-blue-500",
        text: "text-white",
        label: "Sent",
      },
      viewed: {
        icon: <Eye size={12} weight="bold" />,
        bg: "bg-purple-500",
        text: "text-white",
        label: "Viewed",
      },
      paid: {
        icon: <CheckCircle size={12} weight="bold" />,
        bg: "bg-green-500",
        text: "text-white",
        label: "Paid",
      },
      overdue: {
        icon: <Warning size={12} weight="bold" />,
        bg: "bg-red-500",
        text: "text-white",
        label: "Overdue",
      },
      pending: {
        icon: <Clock size={12} weight="bold" />,
        bg: "bg-yellow-500",
        text: "text-white",
        label: "Pending",
      },

      // Payment statuses
      completed: {
        icon: <CheckCircle size={12} weight="bold" />,
        bg: "bg-green-500",
        text: "text-white",
        label: "Completed",
      },
      partially_paid: {
        icon: <ArrowCircleDown size={12} weight="bold" />,
        bg: "bg-orange-500",
        text: "text-white",
        label: "Partial",
      },
      failed: {
        icon: <XCircle size={12} weight="bold" />,
        bg: "bg-red-500",
        text: "text-white",
        label: "Failed",
      },
      refunded: {
        icon: <ArrowsCounterClockwise size={12} weight="bold" />,
        bg: "bg-purple-500",
        text: "text-white",
        label: "Refunded",
      },
      processing: {
        icon: <CircleNotch size={12} weight="bold" className="animate-spin" />,
        bg: "bg-indigo-500",
        text: "text-white",
        label: "Processing",
      },
      cancelled: {
        icon: <Prohibit size={12} weight="bold" />,
        bg: "bg-gray-500",
        text: "text-white",
        label: "Cancelled",
      },

      // Billing statuses
      billed: {
        icon: <CurrencyDollar size={12} weight="bold" />,
        bg: "bg-emerald-500",
        text: "text-white",
        label: "Billed",
      },
      unbilled: {
        icon: <Clock size={12} weight="bold" />,
        bg: "bg-amber-500",
        text: "text-white",
        label: "Unbilled",
      },
      waived: {
        icon: <Prohibit size={12} weight="bold" />,
        bg: "bg-gray-500",
        text: "text-white",
        label: "Waived",
      },
      declined: {
        icon: <XCircle size={12} weight="bold" />,
        bg: "bg-rose-500",
        text: "text-white",
        label: "Declined",
      },
      sending: {
        icon: (
          <PaperPlaneTilt size={12} weight="bold" className="animate-pulse" />
        ),
        bg: "bg-sky-500",
        text: "text-white",
        label: "Sending",
      },
      nonbilled: {
        icon: <FileText size={12} weight="bold" />,
        bg: "bg-slate-500",
        text: "text-white",
        label: "Non-billed",
      },
      non_billable: {
        icon: <Prohibit size={12} weight="bold" />,
        bg: "bg-zinc-500",
        text: "text-white",
        label: "Non-billable",
      },
    };

    return (
      statusConfigs[normalizedStatus] || {
        icon: <Warning size={12} weight="bold" />,
        bg: "bg-gray-500",
        text: "text-white",
        label: statusText,
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-geist-semibold transition-all hover:shadow-md ${config.bg} ${config.text} ${className}`}
    >
      {config.icon}
      <span className="uppercase tracking-wider">{config.label || status}</span>
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;
