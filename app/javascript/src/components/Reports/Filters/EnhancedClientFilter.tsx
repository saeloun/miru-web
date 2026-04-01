import React from "react";
import {
  Users,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  X,
  Check,
} from "phosphor-react";

import { i18n } from "../../../i18n";
import { cn } from "../../../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";

const EnhancedClientFilter = ({
  searchQuery,
  setSearchQuery,
  filteredClientList,
  selectedClients,
  handleSelectClient,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isActive =
    selectedClients.length > 0 && selectedClients[0]?.label !== "All Clients";
  const activeCount = isActive ? selectedClients.length : 0;

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
              <Users
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-[#5E58F1]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{i18n.t("reports.clients")}</p>
              {isActive && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {i18n.t("reports.selected", { count: activeCount })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 bg-[#5E58F1] text-white text-xs"
              >
                {activeCount}
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
        <div className="mt-3 space-y-3">
          {/* MagnifyingGlass Input */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={i18n.t("reports.searchClientsFilter")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm border-gray-200 focus:border-[#5E58F1] focus:ring-[#5E58F1]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Client List */}
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {filteredClientList.length > 0 ? (
                filteredClientList.map(client => {
                  const isChecked = !!selectedClients.find(
                    sc => sc.value === client.value
                  );

                  return (
                    <div
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        "hover:bg-gray-50",
                        isChecked && "bg-[#5E58F1]/5"
                      )}
                    >
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={isChecked}
                        className="border-gray-300 data-[state=checked]:bg-[#5E58F1] data-[state=checked]:border-[#5E58F1]"
                      />
                      <Label
                        htmlFor={`client-${client.id}`}
                        className="text-sm font-normal text-gray-700 cursor-pointer flex-1"
                      >
                        {client.label}
                      </Label>
                      {isChecked && (
                        <Check className="h-4 w-4 text-[#5E58F1]" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  {i18n.t("noResultsFound")}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Stats */}
          {filteredClientList.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                {i18n.t("reports.showingClientsCount", { shown: filteredClientList.length, total: filteredClientList.length })}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EnhancedClientFilter;
