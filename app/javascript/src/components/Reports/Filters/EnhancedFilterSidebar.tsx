import React, { useState, useEffect, useRef } from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import dayjs from "dayjs";

import { useEntry } from "components/Reports/context/EntryContext";
import { useUserContext } from "context/UserContext";
import { useDebounce, useOutsideClick } from "helpers";

import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../../ui/sheet";
import { Separator } from "../../ui/separator";
import { Badge } from "../../ui/badge";

import EnhancedDateRangeFilter from "./EnhancedDateRangeFilter";
import EnhancedClientFilter from "./EnhancedClientFilter";
import EnhancedTeamMembersFilter from "./EnhancedTeamMembersFilter";
import EnhancedStatusFilter from "./EnhancedStatusFilter";
import EnhancedGroupByFilter from "./EnhancedGroupByFilter";
import { statusOption } from "./filterOptions";
import { dateRangeOptions } from "./FilterSidebarOptions";

const EnhancedFilterSidebar = ({
  setIsFilterVisible,
  selectedFilter,
  setFilterCounter,
  resetFilter,
  handleApplyFilter,
  setSelectedInput,
  selectedInput,
}) => {
  const {
    timeEntryReport: { selectedFilter: selectedContextFilter, filterOptions },
  } = useEntry();

  const {
    clients: clientList,
    teamMember: teamMemberList,
    status: statusList,
  } = selectedContextFilter;

  const { clients: selectedClientList, teamMembers: teamMembersList } =
    filterOptions;

  const [filters, setFilters] = useState<any>(selectedFilter);
  const [showCustomFilter, setShowCustomFilter] = useState<boolean>(
    filters.dateRange.value === "custom"
  );
  const [showCustomCalendar, setShowCustomCalendar] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState("");
  const [selectedClients, setSelectedClients] = useState<any[]>(clientList);
  const [selectedTeams, setSelectedTeams] = useState<any[]>(teamMemberList);
  const [selectedStatus, setSelectedStatus] = useState<any[]>(statusList);
  const [filteredClientList, setFilteredClientList] =
    useState<any[]>(selectedClientList);

  const [filteredTeamsList, setFilteredTeamsList] =
    useState<any[]>(teamMembersList);
  const [dateRange, setDateRange] = useState<any>(filters.customDateFilter);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedTeamsSearchQuery = useDebounce(teamMemberSearchQuery, 300);
  const { isDesktop } = useUserContext();
  const [disableDateBtn, setDisableDateBtn] = useState<boolean>(true);
  const [disableApplyBtn, setDisableApplyBtn] = useState(false);
  const wrapperRef = useRef(null);

  useOutsideClick(
    wrapperRef,
    () => setShowCustomCalendar(false),
    selectedInput
  );

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.value !== "all") count++;

    if (
      filters.clients.length > 0 &&
      filters.clients[0].label !== "All Clients"
    ) {
      count += filters.clients.length;
    }

    if (filters.teamMember.length > 0) count += filters.teamMember.length;

    if (filters.status.length > 0) count += filters.status.length;

    if (filters.groupBy && filters.groupBy.value !== "none") count++;

    return count;
  };

  const handleSelectGroupByFilter = selectedGroup => {
    setFilters({
      ...filters,
      groupBy: selectedGroup,
    });
  };

  const handleOpenDateCalendar = () => {
    if (!showCustomCalendar) {
      setShowCustomCalendar(true);
    }
  };

  useEffect(() => {
    const { value } = filters.dateRange;
    if (value === "all") {
      setDateRange({ ...dateRange, from: "", to: "" });
    }

    if (value !== "custom") {
      dateRangeOptions[4].label = "Custom";
    }

    if (dateRange.from && dateRange.to) {
      setDisableDateBtn(false);
    }
  }, [filters.dateRange.value, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (filteredClientList.length) {
      const sortedClients = filteredClientList.sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      if (debouncedSearchQuery && filteredClientList.length > 0) {
        const newClientList = sortedClients.filter(client =>
          client.label
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())
        );
        setFilteredClientList(newClientList.length > 0 ? newClientList : []);
      } else {
        setFilteredClientList(filterOptions?.clients || []);
      }
    } else {
      if (!debouncedSearchQuery) {
        setFilteredClientList(selectedClientList);
      }
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setFilters({
      ...filters,
      customDateFilter: dateRange,
    });
  }, [dateRange]);

  useEffect(() => {
    if (
      filters.dateRange.value === "custom" &&
      !filters.dateRange.from &&
      !filters.dateRange.to &&
      disableDateBtn
    ) {
      setDisableApplyBtn(true);
    } else {
      setDisableApplyBtn(false);
    }
  }, [filters, disableDateBtn]);

  useEffect(() => {
    if (filteredTeamsList.length) {
      const sortedTeams = filteredTeamsList.sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      if (debouncedTeamsSearchQuery && filteredTeamsList.length > 0) {
        const newTeamList = sortedTeams.filter(team =>
          team.label
            .toLowerCase()
            .includes(debouncedTeamsSearchQuery.toLowerCase())
        );
        setFilteredTeamsList(newTeamList.length > 0 ? newTeamList : []);
      } else {
        setFilteredTeamsList(filterOptions?.teamMembers || []);
      }
    } else {
      if (!debouncedTeamsSearchQuery) {
        setFilteredTeamsList(teamMembersList);
      }
    }
  }, [debouncedTeamsSearchQuery]);

  const handleSelectClient = selectedClient => {
    if (filters.clients.find(c => c.value === selectedClient.value)) {
      const newArr = selectedClients.filter(
        client => client.value !== selectedClient.value
      );
      setFilters({ ...filters, clients: newArr });
      setSelectedClients(newArr);
    } else {
      setFilters({
        ...filters,
        clients: [...filters.clients, selectedClient],
      });
      setSelectedClients([...selectedClients, selectedClient]);
    }
  };

  const handleSelectTeamMember = selectedTeamMember => {
    if (
      filters.teamMember.find(
        filter => filter.value === selectedTeamMember.value
      )
    ) {
      const newArr = selectedTeams.filter(
        team => team.value !== selectedTeamMember.value
      );
      setFilters({ ...filters, teamMember: newArr });
      setSelectedTeams(newArr);
    } else {
      setFilters({
        ...filters,
        teamMember: [...filters.teamMember, selectedTeamMember],
      });
      setSelectedTeams([...selectedTeams, selectedTeamMember]);
    }
  };

  const handleSelectStatus = selectedFilter => {
    if (filters.status.find(filter => filter.value === selectedFilter.value)) {
      const newArr = selectedStatus.filter(
        status => status.value !== selectedFilter.value
      );
      setFilters({ ...filters, status: newArr });
      setSelectedStatus(newArr);
    } else {
      setFilters({
        ...filters,
        status: [...filters.status, selectedFilter],
      });
      setSelectedStatus([...selectedStatus, selectedFilter]);
    }
  };

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value !== "custom") {
      dateRangeOptions[4].label = "Custom";
      setShowCustomFilter(false);
      setDateRange({ from: "", to: "" });
    }

    if (selectedValue.value === "custom") {
      setShowCustomFilter(true);
      setFilters({
        ...filters,
        [field.name]: { ...selectedValue, ...dateRange },
      });
    }

    if (field.name === "dateRange") {
      setFilters({
        ...filters,
        [field.name]: selectedValue,
      });
    }
  };

  const submitCustomDatePicker = () => {
    if (dateRange.from && dateRange.to) {
      const fromDate = dayjs(dateRange.from).format("Do MMM");
      const toDate = dayjs(dateRange.to).format("Do MMM");
      dateRangeOptions[4].label = `Custom (${fromDate} - ${toDate})`;
      setFilters({
        ...filters,
        dateRange: {
          value: "custom",
          label: `Custom (${fromDate} - ${toDate})`,
          ...dateRange,
        },
      });
    }
  };

  const handleSelectDate = date => {
    if (selectedInput === "from-input") {
      setDateRange({ ...dateRange, from: date });
    } else {
      setDateRange({ ...dateRange, to: date });
    }
  };

  const onClickInput = e => {
    setSelectedInput(e.target.name);
    setShowCustomCalendar(!showCustomCalendar);
  };

  const handleApply = () => {
    if (disableApplyBtn) return;
    submitCustomDatePicker();
    handleApplyFilter(filters);
    setFilterCounter(selectedClients.length);
    setIsFilterVisible(false);
  };

  const handleReset = () => {
    resetFilter();
    setSelectedClients([]);
    setSelectedTeams([]);
    setSelectedStatus([]);
    setDateRange({ from: "", to: "" });
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Sheet open={true} onOpenChange={setIsFilterVisible}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "flex flex-col p-0",
          isDesktop ? "w-[400px] sm:max-w-[400px]" : "h-[85vh]"
        )}
      >
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="p-2 bg-[#5B34EA]/10 rounded-lg">
                <Filter className="h-4 w-4 text-[#5B34EA]" />
              </div>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-[#5B34EA] text-white hover:bg-[#5B34EA]/90"
                >
                  {activeFilterCount} active
                </Badge>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFilterVisible(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-1 py-4">
            <EnhancedDateRangeFilter
              dateRange={dateRange}
              dateRangeList={dateRangeOptions}
              filters={filters}
              handleOpenDateCalendar={handleOpenDateCalendar}
              handleSelectDate={handleSelectDate}
              handleSelectFilter={handleSelectFilter}
              selectedInput={selectedInput}
              setShowCustomCalendar={setShowCustomCalendar}
              showCustomCalendar={showCustomCalendar}
              showCustomFilter={showCustomFilter}
              submitCustomDatePicker={submitCustomDatePicker}
              wrapperRef={wrapperRef}
              onClickInput={onClickInput}
            />

            <Separator className="my-2" />

            <EnhancedClientFilter
              filteredClientList={filteredClientList}
              handleSelectClient={handleSelectClient}
              searchQuery={searchQuery}
              selectedClients={filters.clients}
              setSearchQuery={setSearchQuery}
            />

            <Separator className="my-2" />

            <EnhancedTeamMembersFilter
              filteredTeamsList={filteredTeamsList}
              handleSelectTeamMember={handleSelectTeamMember}
              searchQuery={teamMemberSearchQuery}
              selectedTeams={selectedTeams}
              setSearchQuery={setTeamMemberSearchQuery}
            />

            <Separator className="my-2" />

            <EnhancedStatusFilter
              filters={filters}
              handleSelectStatus={handleSelectStatus}
              statusOptions={statusOption}
            />

            <Separator className="my-2" />

            <EnhancedGroupByFilter
              filters={filters}
              handleSelectFilter={handleSelectGroupByFilter}
            />
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 font-medium border-gray-200 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleApply}
              disabled={disableApplyBtn}
              className="flex-1 font-medium bg-[#5B34EA] hover:bg-[#5B34EA]/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EnhancedFilterSidebar;
