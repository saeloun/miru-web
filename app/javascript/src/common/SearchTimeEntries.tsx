import React, { useState, useEffect } from "react";

import { useUserContext } from "context/UserContext";
import { useDebounce } from "helpers";
import { CaretDownIcon, SearchIcon, XIcon } from "miruIcons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { MobileMoreOptions } from "StyledComponents";

const SearchTimeEntries = ({
  selectedEmployeeId,
  setSelectedEmployeeId,
  employeeList,
}) => {
  const [showEmployeeList, setShowEmployeeList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployeeList, setFilteredEmployeeList] =
    useState(employeeList);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { isDesktop } = useUserContext();

  useEffect(() => {
    if (debouncedSearchQuery) {
      const newEmployeeList = employeeList.filter(client =>
        client.label.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      setFilteredEmployeeList(newEmployeeList);
    } else {
      setFilteredEmployeeList(employeeList);
    }
  }, [debouncedSearchQuery, employeeList]);

  const currentUser = employeeList?.find(
    emp => emp.value == selectedEmployeeId
  );

  const handleEmployeeChange = selection => {
    setSelectedEmployeeId(selection["value"]);
  };

  return isDesktop ? (
    <Select
      value={currentUser?.value?.toString() || ""}
      onValueChange={value => {
        const selectedEmployee = employeeList.find(
          emp => emp.value.toString() === value
        );
        handleEmployeeChange(selectedEmployee);
      }}
    >
      <SelectTrigger className="w-52" data-testid="user-select">
        <SelectValue placeholder={currentUser?.label || "Select team member"} />
      </SelectTrigger>
      <SelectContent>
        {employeeList.map(employee => (
          <SelectItem key={employee.value} value={employee.value.toString()}>
            {employee.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <>
      <div
        className="flex items-center justify-between text-xs font-bold leading-4 text-primary"
        onClick={() => setShowEmployeeList(true)}
      >
        <label className="mr-2">{currentUser && currentUser.label}</label>
        <CaretDownIcon size={16} />
      </div>
      {showEmployeeList && (
        <MobileMoreOptions
          className="flex h-1/2 flex-col"
          setVisibilty={setShowEmployeeList}
          visibilty={showEmployeeList}
        >
          <div className="relative mt-2 flex w-full items-center">
            <input
              placeholder="Search"
              type="text"
              value={searchQuery}
              className="focus:outline-none w-full rounded bg-muted p-2
            text-sm font-medium focus:border-border focus:ring-1 focus:ring-ring"
              onChange={e => {
                setSearchQuery(e.target.value);
              }}
            />
            {searchQuery ? (
              <XIcon
                className="absolute right-8"
                color="#1D1A31"
                size={16}
                onClick={() => setSearchQuery("")}
              />
            ) : (
              <SearchIcon
                className="absolute right-2"
                color="#1D1A31"
                size={16}
              />
            )}
          </div>
          <div className="flex flex-auto flex-col overflow-y-scroll">
            {filteredEmployeeList.map(employee => (
              <li
                key={employee.value}
                className={`flex items-center px-2 pt-3 text-sm leading-5 text-foreground hover:bg-muted ${
                  currentUser?.value === employee.value
                    ? "font-bold"
                    : "font-medium"
                }`}
                onClick={() => handleEmployeeChange(employee)}
              >
                {employee.label}
              </li>
            ))}
          </div>
        </MobileMoreOptions>
      )}
    </>
  );
};

export default SearchTimeEntries;
