import React from "react";
import {
  UserCheck,
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
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

const SidebarTeamMembersFilter = ({
  searchQuery,
  setSearchQuery,
  filteredTeamsList,
  selectedTeams,
  handleSelectTeamMember,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeCount = selectedTeams.length;

  const getInitials = (name: string) => {
    const parts = name.split(" ");

    return parts
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeCount > 0 ? "bg-[#5E58F1]/10" : "bg-gray-100"
              )}
            >
              <UserCheck
                className={cn(
                  "h-4 w-4",
                  activeCount > 0 ? "text-[#5E58F1]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {i18n.t("reports.teamMembers")}
              </p>
              {activeCount > 0 && (
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
              placeholder={i18n.t("reports.searchTeamMembersFilter")}
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

          {/* Team Members List */}
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {filteredTeamsList.length > 0 ? (
                filteredTeamsList.map(member => {
                  const isChecked = !!selectedTeams.find(
                    st => st.value === member.value
                  );

                  return (
                    <div
                      key={member.id || member.value}
                      onClick={() => handleSelectTeamMember(member)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        "hover:bg-gray-50",
                        isChecked && "bg-[#5E58F1]/5"
                      )}
                    >
                      <Checkbox
                        id={`team-${member.id || member.value}`}
                        checked={isChecked}
                        className="border-gray-300 data-[state=checked]:bg-[#5E58F1] data-[state=checked]:border-[#5E58F1]"
                      />
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs bg-[#5E58F1]/10 text-[#5E58F1]">
                          {getInitials(member.label)}
                        </AvatarFallback>
                      </Avatar>
                      <Label
                        htmlFor={`team-${member.id || member.value}`}
                        className="text-sm font-normal text-gray-700 cursor-pointer flex-1"
                      >
                        {member.label}
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
          {filteredTeamsList.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                {i18n.t("reports.ofTeamMembersSelected", {
                  active: activeCount,
                  total: filteredTeamsList.length,
                })}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SidebarTeamMembersFilter;
