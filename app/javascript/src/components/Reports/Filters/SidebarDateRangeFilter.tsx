import React from "react";
import { Calendar, CaretDown, CaretUp } from "phosphor-react";

import CustomDateRangeWithInput from "common/CustomDateRangeWIthInput";
import { i18n } from "../../../i18n";
import { cn } from "../../../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";

const SidebarDateRangeFilter = ({
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
        <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isActive ? "bg-[hsl(var(--primary))]/10" : "bg-muted"
              )}
            >
              <Calendar
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-[hsl(var(--primary))]"
                    : "text-muted-foreground"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                {i18n.t("dateRange")}
              </p>
              {isActive && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filters.dateRange.label}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 bg-[hsl(var(--primary))] text-white text-xs"
              >
                1
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
        <RadioGroup value={filters.dateRange.value} className="space-y-2 mt-3">
          {dateRangeList.map(dateRangeOption => (
            <div
              key={dateRangeOption.value}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md transition-colors",
                "hover:bg-muted cursor-pointer"
              )}
              onClick={() =>
                handleSelectFilter(dateRangeOption, { name: "dateRange" })
              }
            >
              <RadioGroupItem
                value={dateRangeOption.value}
                id={dateRangeOption.value}
                className="border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
              />
              <Label
                htmlFor={dateRangeOption.value}
                className="text-sm font-normal text-muted-foreground cursor-pointer flex-1"
              >
                {dateRangeOption.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showCustomFilter && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
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

export default SidebarDateRangeFilter;
