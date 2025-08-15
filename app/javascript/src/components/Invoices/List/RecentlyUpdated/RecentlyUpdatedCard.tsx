import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import { Avatar } from "StyledComponents";
import StatusBadge from "components/ui/status-badge";
import {
  DollarSign,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
} from "lucide-react";

const RecentlyUpdatedCard = ({
  invoice: { client, currency, id, invoiceNumber, amount, status },
  index,
}) => {
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case "sent":
        return <Send className="w-3 h-3 text-blue-600" />;
      case "viewed":
        return <Clock className="w-3 h-3 text-cyan-600" />;
      case "overdue":
        return <AlertTriangle className="w-3 h-3 text-red-600" />;
      case "draft":
        return <FileText className="w-3 h-3 text-gray-600" />;
      default:
        return <FileText className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-50 border-green-200 hover:bg-green-100/50";
      case "sent":
      case "viewed":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100/50";
      case "overdue":
        return "bg-red-50 border-red-200 hover:bg-red-100/50";
      case "draft":
        return "bg-gray-50 border-gray-200 hover:bg-gray-100/50";
      default:
        return "bg-white border-gray-200 hover:bg-gray-50";
    }
  };

  return (
    <div
      className={`${
        index == 0 ? "mr-3" : "mx-1.5"
      } group relative flex h-44 w-56 cursor-pointer flex-col rounded-xl border ${getStatusColor(
        status
      )} p-5 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-[#5B34EA]/40`}
      onClick={() => navigate(`/invoices/${id}`)}
    >
      {/* Header with Invoice # and Status Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            #{invoiceNumber}
          </span>
        </div>
        {getStatusIcon(status)}
      </div>

      {/* Client Row */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar
          url={client.logo}
          name={client.name}
          size="h-8 w-8"
          classNameImg="h-8 w-8"
          classNameInitialsWrapper="h-8 w-8 bg-[#5B34EA]/10 text-[#5B34EA]"
          classNameInitials="text-xs font-medium"
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium text-gray-900 truncate"
            title={client.name}
          >
            {client.name}
          </p>
          <p className="text-xs text-gray-500">Client</p>
        </div>
      </div>

      {/* Amount Row */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-lg font-bold text-gray-900">
            {currencyFormat(currency, amount)}
          </span>
        </div>
        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#5B34EA] transition-colors" />
      </div>

      {/* Status Badge - Better positioned */}
      <div className="absolute top-3 right-3">
        <StatusBadge
          status={status}
          className="text-[9px] py-1 px-2 rounded-lg"
        />
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
