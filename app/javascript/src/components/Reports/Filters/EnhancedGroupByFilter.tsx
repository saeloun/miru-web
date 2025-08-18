import React from "react";
import { Stack, CaretDown, CaretUp } from "phosphor-react";

import { cn } from "../../../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";

const groupByOptions = [
  {
    value: "none",
    label: "No Grouping",
    icon: "🚫",
    description: "Show all entries",
  },
  {
    value: "client",
    label: "By Client",
    icon: "👥",
    description: "Group by client name",
  },
  {
    value: "project",
    label: "By Project",
    icon: "📁",
    description: "Group by project",
  },
  {
    value: "member",
    label: "By Team Member",
    icon: "👤",
    description: "Group by assignee",
  },
  { value: "date", label: "By Date", icon: "📅", description: "Group by date" },
  { value: "week", label: "By Week", icon: "📆", description: "Group by week" },
  {
    value: "month",
    label: "By Month",
    icon: "🗓️",
    description: "Group by month",
  },
];

const EnhancedGroupByFilter = ({ filters, handleSelectFilter }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentValue = filters.groupBy?.value || "none";
  const isActive = currentValue !== "none";
  const currentOption = groupByOptions.find(opt => opt.value === currentValue);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isActive ? "bg-[#5B34EA]/10" : "bg-gray-100"
              )}
            >
              <Stack
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-[#5B34EA]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Group By</p>
              {isActive && currentOption && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentOption.label}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 bg-[#5B34EA] text-white text-xs"
              >
                1
              </Badge>
            )}
            {isOpen ? (
              <CaretUp className="h-4 w-4 text-gray-400" />
            ) : (
              <CaretDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-3">
        <RadioGroup
          value={currentValue}
          onValueChange={value => {
            const option = groupByOptions.find(opt => opt.value === value);
            if (option) {
              handleSelectFilter(option);
            }
          }}
          className="mt-3 space-y-1"
        >
          {groupByOptions.map(option => (
            <div
              key={option.value}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all",
                "hover:bg-gray-50 border",
                currentValue === option.value
                  ? "border-[#5B34EA]/30 bg-[#5B34EA]/5"
                  : "border-transparent"
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`groupby-${option.value}`}
                className="mt-0.5 border-gray-300 text-[#5B34EA] focus:ring-[#5B34EA]"
              />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1">
                  <Label
                    htmlFor={`groupby-${option.value}`}
                    className="text-sm font-medium text-gray-900 cursor-pointer block"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </p>
                </div>
              </div>
              {currentValue === option.value && (
                <div className="absolute top-3 right-3">
                  <div className="h-2 w-2 rounded-full bg-[#5B34EA]" />
                </div>
              )}
            </div>
          ))}
        </RadioGroup>

        {/* Visual Preview */}
        {currentValue !== "none" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#5B34EA] rounded-full" />
                <span className="text-xs text-gray-700">
                  Entries will be grouped {currentOption?.label.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500">
                  Subtotals will be shown for each group
                </span>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EnhancedGroupByFilter;
