import React, { useState, useEffect } from "react";

import { useDebounce } from "helpers";
import { CaretDownIcon, SearchIcon, XIcon } from "miruIcons";
import Select from "react-select";
import { MobileMoreOptions } from "StyledComponents";

import { useUserContext } from "context/UserContext";

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
    if (debouncedSearchQuery && filteredEmployeeList.length > 0) {
      const newEmployeeList = filteredEmployeeList.filter(client =>
        client.label.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

      newEmployeeList.length > 0
        ? setFilteredEmployeeList(newEmployeeList)
        : setFilteredEmployeeList([]);
    } else {
      setFilteredEmployeeList(employeeList);
    }
  }, [debouncedSearchQuery]);

  const currentUser = employeeList?.find(
    emp => emp.value == selectedEmployeeId
  );

  const handleEmployeeChange = selection => {
    setSelectedEmployeeId(selection["value"]);
  };

  const customStyles = {
    container: base => ({
      ...base,
      width: "13rem",
    }),
    control: provided => ({
      ...provided,
      "&:hover": {
        borderColor: "#5B34EA",
      },
      "&:focus": {
        borderColor: "#5B34EA",
      },
      "&:active": {
        borderColor: "#5B34EA",
      },
    }),
    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected && "#5B34EA",
      "&:hover": {
        backgroundColor: isSelected ? "#5B34EA" : "#F5F7F9",
      },
    }),
  };

  return isDesktop ? (
    <Select
      isSearchable
      defaultValue={currentUser}
      options={employeeList}
      styles={customStyles}
      value={currentUser}
      onChange={handleEmployeeChange}
    />
  ) : (
    <>
      <div
        className="flex items-center justify-between text-xs font-bold leading-4 text-miru-han-purple-1000"
        onClick={() => setShowEmployeeList(true)}
      >
        <label className="mr-2">{currentUser && currentUser.label}</label>
        <CaretDownIcon size={16} />
      </div>
      {showEmployeeList && (
        <MobileMoreOptions
          className="flex h-1/2 flex-col"
          setVisibilty={setShowEmployeeList}
        >
          <div className="relative mt-2 flex w-full items-center">
            <input
              placeholder="Search"
              type="text"
              value={searchQuery}
              className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
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
                className={`flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100 ${
                  currentUser.value === employee.value
                    ? "font-extrabold"
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
