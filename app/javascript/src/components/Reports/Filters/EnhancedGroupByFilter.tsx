import React from "react";
import { Stack, CaretDown, CaretUp } from "phosphor-react";

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

const getGroupByOptions = () => [
  {
    value: "none",
    label: i18n.t("reports.noGrouping"),
    icon: "🚫",
    description: i18n.t("reports.showAllEntries"),
  },
  {
    value: "client",
    label: i18n.t("reports.byClient"),
    icon: "👥",
    description: i18n.t("reports.groupByClientName"),
  },
  {
    value: "project",
    label: i18n.t("reports.byProject"),
    icon: "📁",
    description: i18n.t("reports.groupByProjectDesc"),
  },
  {
    value: "member",
    label: i18n.t("reports.byTeamMember"),
    icon: "👤",
    description: i18n.t("reports.groupByAssignee"),
  },
  { value: "date", label: i18n.t("reports.byDate"), icon: "📅", description: i18n.t("reports.groupByDate") },
  { value: "week", label: i18n.t("reports.byWeek"), icon: "📆", description: i18n.t("reports.groupByWeek") },
  {
    value: "month",
    label: i18n.t("reports.byMonth"),
    icon: "🗓️",
    description: i18n.t("reports.groupByMonth"),
  },
];

const EnhancedGroupByFilter = ({ filters, handleSelectFilter }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentValue = filters.groupBy?.value || "none";
  const isActive = currentValue !== "none";
  const currentOption = getGroupByOptions().find(opt => opt.value === currentValue);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isActive ? "bg-[#5E58F1]/10" : "bg-gray-100"
              )}
            >
              <Stack
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-[#5E58F1]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{i18n.t("reports.groupBy")}</p>
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
                className="h-5 px-1.5 bg-[#5E58F1] text-white text-xs"
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
            const option = getGroupByOptions().find(opt => opt.value === value);
            if (option) {
              handleSelectFilter(option);
            }
          }}
          className="mt-3 space-y-1"
        >
          {getGroupByOptions().map(option => (
            <div
              key={option.value}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all",
                "hover:bg-gray-50 border",
                currentValue === option.value
                  ? "border-[#5E58F1]/30 bg-[#5E58F1]/5"
                  : "border-transparent"
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`groupby-${option.value}`}
                className="mt-0.5 border-gray-300 text-[#5E58F1] focus:ring-[#5E58F1]"
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
                  <div className="h-2 w-2 rounded-full bg-[#5E58F1]" />
                </div>
              )}
            </div>
          ))}
        </RadioGroup>

        {/* Visual Preview */}
        {currentValue !== "none" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">{i18n.t("reports.previewLabel")}</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#5E58F1] rounded-full" />
                <span className="text-xs text-gray-700">
                  {i18n.t("reports.entriesWillBeGrouped", { grouping: currentOption?.label.toLowerCase() })}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500">
                  {i18n.t("reports.subtotalsShownForEachGroup")}
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
