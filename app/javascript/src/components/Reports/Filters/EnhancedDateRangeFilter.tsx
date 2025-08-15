import React from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

import CustomDateRangeWithInput from "common/CustomDateRangeWIthInput";
import { cn } from "../../../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";

const EnhancedDateRangeFilter = ({
  filters,
  dateRangeList,
  showCustomFilter,
  dateRange,
  handleSelectDate,
  selectedInput,
  onClickInput,
  submitCustomDatePicker,
  handleSelectFilter,
  wrapperRef,
  showCustomCalendar,
  handleOpenDateCalendar,
  setShowCustomCalendar,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isActive = filters.dateRange.value !== "all";

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
              <Calendar
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-[#5B34EA]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Date Range</p>
              {isActive && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {filters.dateRange.label}
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
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-3">
        <RadioGroup value={filters.dateRange.value} className="space-y-2 mt-3">
          {dateRangeList.map(dateRangeOption => (
            <div
              key={dateRangeOption.value}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md transition-colors",
                "hover:bg-gray-50 cursor-pointer"
              )}
              onClick={() =>
                handleSelectFilter(dateRangeOption, { name: "dateRange" })
              }
            >
              <RadioGroupItem
                value={dateRangeOption.value}
                id={dateRangeOption.value}
                className="border-gray-300 text-[#5B34EA] focus:ring-[#5B34EA]"
              />
              <Label
                htmlFor={dateRangeOption.value}
                className="text-sm font-normal text-gray-700 cursor-pointer flex-1"
              >
                {dateRangeOption.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showCustomFilter && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <CustomDateRangeWithInput
              dateRange={dateRange}
              handleOpenDateCalendar={handleOpenDateCalendar}
              handleSelectDate={handleSelectDate}
              selectedInput={selectedInput}
              setShowCustomCalendar={setShowCustomCalendar}
              showCustomCalendar={showCustomCalendar}
              submitCustomDatePicker={submitCustomDatePicker}
              wrapperRef={wrapperRef}
              onClickInput={onClickInput}
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EnhancedDateRangeFilter;
