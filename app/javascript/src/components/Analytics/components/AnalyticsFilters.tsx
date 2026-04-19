import React from "react";
import { Check, FunnelSimple, X } from "phosphor-react";
import { DateRange } from "react-day-picker";

import {
  getMultiFilterLabel,
  toggleNumberListValue,
} from "components/Reports/filterUtils";

import { AnalyticsOption } from "../types";
import { ANALYTICS_PRESETS, resolveAnalyticsPreset } from "../utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { DateRangePicker } from "../../ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

type AnalyticsFiltersProps = {
  dateRange: DateRange | undefined;
  onDateRangeChange: (value: DateRange | undefined) => void;
  preset: string;
  onPresetChange: (value: string) => void;
  selectedIds?: number[];
  onSelectedIdsChange?: (value: number[]) => void;
  options?: AnalyticsOption[];
  multiSelectLabel?: string;
};

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  preset,
  onPresetChange,
  selectedIds = [],
  onSelectedIdsChange,
  options = [],
  multiSelectLabel,
}) => {
  const activeFilterCount = [
    preset !== "last_30_days",
    selectedIds.length > 0,
  ].filter(Boolean).length;

  return (
    <Card className="border-border">
      <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-[180px] space-y-2">
            <label className="text-sm font-medium text-foreground">Range</label>
            <Select value={preset} onValueChange={onPresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {ANALYTICS_PRESETS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[280px] flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">
              Custom dates
            </label>
            <DateRangePicker
              className="w-full"
              date={dateRange}
              onSelect={value => {
                onPresetChange("custom");
                onDateRangeChange(value);
              }}
              placeholder="Pick a date range"
            />
          </div>

          {multiSelectLabel && onSelectedIdsChange ? (
            <div className="min-w-[240px] space-y-2">
              <label className="text-sm font-medium text-foreground">
                {multiSelectLabel}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full justify-between" variant="outline">
                    <span>
                      {getMultiFilterLabel(
                        `All ${multiSelectLabel}`,
                        selectedIds.length
                      )}
                    </span>
                    <span className="ml-2">
                      {selectedIds.length > 0 ? (
                        <Badge variant="secondary">{selectedIds.length}</Badge>
                      ) : null}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[280px] p-0">
                  <Command>
                    <CommandInput
                      placeholder={`Search ${multiSelectLabel.toLowerCase()}`}
                    />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {options.map(option => {
                          const isSelected = selectedIds.includes(option.id);

                          return (
                            <CommandItem
                              key={option.id}
                              onSelect={() =>
                                onSelectedIdsChange(
                                  toggleNumberListValue(selectedIds, option.id)
                                )
                              }
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  isSelected ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {option.label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FunnelSimple className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            ) : null}
          </div>
          {(preset !== "last_30_days" || selectedIds.length > 0) && (
            <Button
              variant="ghost"
              onClick={() => {
                onPresetChange("last_30_days");
                onDateRangeChange(resolveAnalyticsPreset("last_30_days"));
                onSelectedIdsChange?.([]);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsFilters;
