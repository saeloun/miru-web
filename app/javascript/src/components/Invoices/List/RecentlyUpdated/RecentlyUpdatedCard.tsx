import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import { Avatar } from "StyledComponents";
import StatusBadge from "components/ui/status-badge";

const RecentlyUpdatedCard = ({
  invoice: { client, currency, id, invoiceNumber, amount, status },
  index,
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-50 border-green-200";
      case "sent":
      case "viewed":
        return "bg-blue-50 border-blue-200";
      case "overdue":
        return "bg-red-50 border-red-200";
      case "draft":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <div
      className={`${
        index == 0 ? "mr-1.5" : "mx-1.5"
      } group relative flex h-auto w-36 cursor-pointer flex-col rounded-lg border ${getStatusColor(
        status
      )} bg-gradient-to-b from-white to-transparent p-3 transition-all hover:shadow-md hover:scale-105 hover:border-[#5B34EA]/30`}
      onClick={() => navigate(`/invoices/${id}`)}
    >
      {/* Invoice Number Badge */}
      <div className="absolute -top-2 left-3 px-2 py-0.5 bg-white rounded-full border border-gray-200">
        <span className="text-[10px] font-medium text-gray-600">
          #{invoiceNumber}
        </span>
      </div>

      {/* Client Info Section */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <div className="flex-shrink-0">
          <Avatar
            url={client.logo}
            name={client.name}
            size="h-8 w-8"
            classNameImg="h-8 w-8"
            classNameInitialsWrapper="h-8 w-8 bg-[#5B34EA]/10 text-[#5B34EA]"
            classNameInitials="text-xs font-medium"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold text-gray-900 truncate"
            title={client.name}
          >
            {client.name}
          </p>
        </div>
      </div>

      {/* Amount Section */}
      <div className="mb-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          Amount
        </p>
        <p className="text-lg font-bold text-gray-900 truncate">
          {currencyFormat(currency, amount)}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <StatusBadge status={status} className="text-[10px] py-0.5 px-2" />
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-[#5B34EA] transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
