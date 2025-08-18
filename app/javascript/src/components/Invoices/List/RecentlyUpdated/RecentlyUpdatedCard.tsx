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
    // Use subtle gray colors for all statuses
    return "bg-white border-gray-200 hover:bg-gray-50";
  };

  return (
    <div
      className={`${
        index == 0 ? "mr-4" : "mx-2"
      } group relative flex h-52 w-64 cursor-pointer flex-col rounded-lg border ${getStatusColor(
        status
      )} p-5 transition-all duration-200 hover:shadow-md hover:border-gray-300`}
      onClick={() => navigate(`/invoices/${id}`)}
    >
      {/* Header with Invoice # and improved spacing */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gray-100">
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-wide">
            {invoiceNumber}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {getStatusIcon(status)}
        </div>
      </div>

      {/* Client Row - improved spacing and typography */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar
          url={client.logo}
          name={client.name}
          size="h-10 w-10"
          classNameImg="h-10 w-10"
          classNameInitialsWrapper="h-10 w-10 bg-gray-100 text-gray-700 border-2 border-gray-200"
          classNameInitials="text-sm font-semibold"
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold text-gray-900 truncate mb-1"
            title={client.name}
          >
            {client.name}
          </p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Client</p>
        </div>
      </div>

      {/* Amount Row - improved visual emphasis */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-50">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            {currencyFormat(currency, amount)}
          </span>
        </div>
        <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
      </div>

      {/* Status Badge - repositioned for better visibility */}
      <div className="absolute top-4 right-4">
        <StatusBadge
          status={status}
          className="text-xs py-1.5 px-3 rounded-full font-medium shadow-sm"
        />
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
