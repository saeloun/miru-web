import React from "react";
import { Activity, CaretDown, CaretUp, Check } from "phosphor-react";

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
        return "bg-card text-card-foreground border-border";
      case "unbilled":
        return "bg-muted text-foreground border-border";
      case "overdue":
        return "bg-card text-card-foreground border-border";
      case "paid":
        return "bg-card text-card-foreground border-border";
      case "pending":
        return "bg-muted text-foreground border-border";
      default:
        return "bg-card text-card-foreground border-border";
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
        <div className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-muted">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeCount > 0 ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Activity
                className={cn(
                  "h-4 w-4",
                  activeCount > 0 ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Status</p>
              {activeCount > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeCount} selected
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 bg-primary px-1.5 text-xs text-primary-foreground"
              >
                {activeCount}
              </Badge>
            )}
            {isOpen ? (
              <CaretUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <CaretDown className="h-4 w-4 text-muted-foreground" />
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
                  "hover:bg-muted border",
                  isChecked
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent"
                )}
              >
                <Checkbox
                  id={`status-${status.value}`}
                  checked={isChecked}
                  className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{getStatusIcon(status.label)}</span>
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="cursor-pointer text-sm font-normal text-foreground"
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
                {isChecked && <Check className="h-4 w-4 text-primary" />}
              </div>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-xs text-muted-foreground">Status Guide:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {statusOptions.map(status => (
              <div
                key={`legend-${status.value}`}
                className="flex items-center gap-1"
              >
                <span>{getStatusIcon(status.label)}</span>
                <span className="text-muted-foreground">{status.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EnhancedStatusFilter;
