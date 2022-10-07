import React from "react";

import Select from "react-select";

const SearchTimeEntries = ({
  selectedEmployeeId,
  setSelectedEmployeeId,
  employeeList
}) => {
  const currentUser = employeeList?.find((emp) => emp.value == selectedEmployeeId);

  const handleEmployeeChange = (selection) => {
    setSelectedEmployeeId(selection["value"]);
  };

  const customStyles = {
    container: base => ({
      ...base,
      width: "13rem"
    }),
    control: (provided) => ({
      ...provided,
      "&:hover": {
        borderColor: "#5B34EA"
      },
      "&:focus": {
        borderColor: "#5B34EA"
      },
      "&:active": {
        borderColor: "#5B34EA"
      }
    }),
    option: (
      styles,{ isSelected }
    ) => ({
      ...styles,
      backgroundColor: isSelected && "#5B34EA",
      "&:hover": {
        backgroundColor: isSelected ? "#5B34EA" : "#F5F7F9"
      }
    })
  };

  return (
    <Select
      value={currentUser}
      defaultValue={currentUser}
      onChange={handleEmployeeChange}
      options={employeeList}
      isSearchable={true}
      styles={customStyles}
    />
  );
};

export default SearchTimeEntries;
