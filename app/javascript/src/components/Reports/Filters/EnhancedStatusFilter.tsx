import React from "react";
import { Activity, ChevronDown, ChevronUp, Check } from "lucide-react";

import { cn } from "../../../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";

const EnhancedStatusFilter = ({
  filters,
  handleSelectStatus,
  statusOptions,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeCount = filters.status.length;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "billed":
        return "bg-green-100 text-green-700 border-green-200";
      case "unbilled":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-700 border-red-200";
      case "paid":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "billed":
        return "💵";
      case "unbilled":
        return "📝";
      case "overdue":
        return "⚠️";
      case "paid":
        return "✅";
      case "pending":
        return "⏳";
      default:
        return "📊";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeCount > 0 ? "bg-[#5B34EA]/10" : "bg-gray-100"
              )}
            >
              <Activity
                className={cn(
                  "h-4 w-4",
                  activeCount > 0 ? "text-[#5B34EA]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Status</p>
              {activeCount > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeCount} selected
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 bg-[#5B34EA] text-white text-xs"
              >
                {activeCount}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-3">
        <div className="mt-3 space-y-2">
          {statusOptions.map(status => {
            const isChecked = !!filters.status.find(
              s => s.value === status.value
            );

            return (
              <div
                key={status.value}
                onClick={() => handleSelectStatus(status)}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all",
                  "hover:bg-gray-50 border",
                  isChecked
                    ? "border-[#5B34EA]/30 bg-[#5B34EA]/5"
                    : "border-transparent"
                )}
              >
                <Checkbox
                  id={`status-${status.value}`}
                  checked={isChecked}
                  className="border-gray-300 data-[state=checked]:bg-[#5B34EA] data-[state=checked]:border-[#5B34EA]"
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{getStatusIcon(status.label)}</span>
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-normal text-gray-700 cursor-pointer"
                  >
                    {status.label}
                  </Label>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-0.5",
                    getStatusColor(status.label)
                  )}
                >
                  {status.label}
                </Badge>
                {isChecked && <Check className="h-4 w-4 text-[#5B34EA]" />}
              </div>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Status Guide:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {statusOptions.map(status => (
              <div
                key={`legend-${status.value}`}
                className="flex items-center gap-1"
              >
                <span>{getStatusIcon(status.label)}</span>
                <span className="text-gray-600">{status.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EnhancedStatusFilter;
