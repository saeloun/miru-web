import React from "react";

import Select from "react-select";

const SearchTeamMembers = ({
  teamMembers,
  filters,
  handleSelectFilter
}) => {
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
      isSearchable={true}
      isMulti={true}
      placeholder="All"
      classNamePrefix="react-select-filter"
      name="teamMembers"
      value={filters.teamMembers}
      options={teamMembers}
      onChange={handleSelectFilter}
      styles={customStyles}
    />
  );
};

export default SearchTeamMembers;
