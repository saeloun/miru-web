import React from "react";
import {
  CheckCircle,
  Clock,
  Send,
  Eye,
  AlertCircle,
  XCircle,
  DollarSign,
  FileText,
  RefreshCw,
  Ban,
  Loader2,
  ArrowDownCircle,
} from "lucide-react";

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
        icon: <FileText className="h-3 w-3" />,
        bg: "bg-slate-100",
        text: "text-slate-700",
        label: "Draft",
      },
      sent: {
        icon: <Send className="h-3 w-3" />,
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Sent",
      },
      viewed: {
        icon: <Eye className="h-3 w-3" />,
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "Viewed",
      },
      paid: {
        icon: <CheckCircle className="h-3 w-3" />,
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Paid",
      },
      overdue: {
        icon: <AlertCircle className="h-3 w-3" />,
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Overdue",
      },
      pending: {
        icon: <Clock className="h-3 w-3" />,
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Pending",
      },

      // Payment statuses
      partially_paid: {
        icon: <ArrowDownCircle className="h-3 w-3" />,
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "Partial",
      },
      failed: {
        icon: <XCircle className="h-3 w-3" />,
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Failed",
      },
      refunded: {
        icon: <RefreshCw className="h-3 w-3" />,
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Refunded",
      },
      processing: {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "Processing",
      },
      cancelled: {
        icon: <Ban className="h-3 w-3" />,
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Cancelled",
      },

      // Billing statuses
      billed: {
        icon: <DollarSign className="h-3 w-3" />,
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Billed",
      },
      unbilled: {
        icon: <Clock className="h-3 w-3" />,
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Unbilled",
      },
      waived: {
        icon: <Ban className="h-3 w-3" />,
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Waived",
      },
      declined: {
        icon: <XCircle className="h-3 w-3" />,
        bg: "bg-rose-100",
        text: "text-rose-700",
        label: "Declined",
      },
      sending: {
        icon: <Send className="h-3 w-3 animate-pulse" />,
        bg: "bg-sky-100",
        text: "text-sky-700",
        label: "Sending",
      },
      nonbilled: {
        icon: <FileText className="h-3 w-3" />,
        bg: "bg-slate-100",
        text: "text-slate-600",
        label: "Non-billed",
      },
      non_billable: {
        icon: <Ban className="h-3 w-3" />,
        bg: "bg-zinc-100",
        text: "text-zinc-600",
        label: "Non-billable",
      },
    };

    return (
      statusConfigs[normalizedStatus] || {
        icon: <AlertCircle className="h-3 w-3" />,
        bg: "bg-gray-100",
        text: "text-gray-700",
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
