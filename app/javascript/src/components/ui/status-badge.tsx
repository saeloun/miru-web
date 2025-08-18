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
        icon: <FileText size={12} weight="regular" />,
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Draft",
      },
      sent: {
        icon: <PaperPlaneTilt size={12} weight="regular" />,
        bg: "bg-blue-50",
        text: "text-blue-800",
        label: "Sent",
      },
      viewed: {
        icon: <Eye size={12} weight="regular" />,
        bg: "bg-indigo-50",
        text: "text-indigo-800",
        label: "Viewed",
      },
      paid: {
        icon: <CheckCircle size={12} weight="regular" />,
        bg: "bg-green-50",
        text: "text-green-800",
        label: "Paid",
      },
      overdue: {
        icon: <Warning size={12} weight="regular" />,
        bg: "bg-red-50",
        text: "text-red-800",
        label: "Overdue",
      },
      pending: {
        icon: <Clock size={12} weight="regular" />,
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        label: "Pending",
      },

      // Payment statuses
      partially_paid: {
        icon: <ArrowCircleDown size={12} weight="regular" />,
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "Partial",
      },
      failed: {
        icon: <XCircle size={12} weight="regular" />,
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Failed",
      },
      refunded: {
        icon: <ArrowsCounterClockwise size={12} weight="regular" />,
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Refunded",
      },
      processing: {
        icon: <CircleNotch size={12} weight="regular" className="animate-spin" />,
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "Processing",
      },
      cancelled: {
        icon: <Prohibit size={12} weight="regular" />,
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Cancelled",
      },

      // Billing statuses
      billed: {
        icon: <CurrencyDollar size={12} weight="regular" />,
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Billed",
      },
      unbilled: {
        icon: <Clock size={12} weight="regular" />,
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Unbilled",
      },
      waived: {
        icon: <Prohibit size={12} weight="regular" />,
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Waived",
      },
      declined: {
        icon: <XCircle size={12} weight="regular" />,
        bg: "bg-rose-100",
        text: "text-rose-700",
        label: "Declined",
      },
      sending: {
        icon: <PaperPlaneTilt size={12} weight="regular" className="animate-pulse" />,
        bg: "bg-sky-100",
        text: "text-sky-700",
        label: "Sending",
      },
      nonbilled: {
        icon: <FileText size={12} weight="regular" />,
        bg: "bg-slate-100",
        text: "text-slate-600",
        label: "Non-billed",
      },
      non_billable: {
        icon: <Prohibit size={12} weight="regular" />,
        bg: "bg-zinc-100",
        text: "text-zinc-600",
        label: "Non-billable",
      },
    };

    return (
      statusConfigs[normalizedStatus] || {
        icon: <Warning size={12} weight="regular" />,
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: statusText,
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text} ${className}`}
    >
      {config.icon}
      <span className="uppercase tracking-wide">{config.label || status}</span>
    </span>
  );
};

export default StatusBadge;
