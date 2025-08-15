import React from "react";
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Check,
} from "lucide-react";

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

const EnhancedTeamMembersFilter = ({
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
                activeCount > 0 ? "bg-[#5B34EA]/10" : "bg-gray-100"
              )}
            >
              <UserCheck
                className={cn(
                  "h-4 w-4",
                  activeCount > 0 ? "text-[#5B34EA]" : "text-gray-600"
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Team Members</p>
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
        <div className="mt-3 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm border-gray-200 focus:border-[#5B34EA] focus:ring-[#5B34EA]"
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
                        isChecked && "bg-[#5B34EA]/5"
                      )}
                    >
                      <Checkbox
                        id={`team-${member.id || member.value}`}
                        checked={isChecked}
                        className="border-gray-300 data-[state=checked]:bg-[#5B34EA] data-[state=checked]:border-[#5B34EA]"
                      />
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs bg-[#5B34EA]/10 text-[#5B34EA]">
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
                        <Check className="h-4 w-4 text-[#5B34EA]" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  No team members found
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Stats */}
          {filteredTeamsList.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                {activeCount} of {filteredTeamsList.length} team members
                selected
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EnhancedTeamMembersFilter;
