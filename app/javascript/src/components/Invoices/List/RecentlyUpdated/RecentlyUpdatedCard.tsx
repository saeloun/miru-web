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
  ArrowUpRight 
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
        return <PaperPlaneTilt className="w-4 h-4 text-blue-600" weight="fill" />;
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
      className="group flex h-44 w-40 flex-shrink-0 cursor-pointer flex-col rounded-xl border bg-white border-gray-200 hover:bg-gray-50 p-4 transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:scale-[1.02]"
      onClick={() => navigate(`/invoices/${id}`)}
    >
      {/* Invoice number with status icon */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-gray-900 truncate" title={invoiceNumber}>
            {invoiceNumber}
          </p>
          {getStatusIcon()}
        </div>
      </div>

      {/* Client name */}
      <div className="mb-auto">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Client</p>
        <p className="text-sm text-gray-700 font-medium truncate" title={client.name}>
          {client.name}
        </p>
      </div>

      {/* Amount at bottom */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Amount</p>
            <p className="text-base font-bold text-gray-900">
              {currencyFormat(currency, amount)}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
