import React, { useEffect, useState } from "react";

import { MultiSelect } from "react-multi-select-component";

const SearchTeamMembers = ({
  teamMembers,
  filters,
  setFilters
}) => {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (filters.teamMembers.length == 0){
      setSelected(teamMembers);
    }
  }, [filters.teamMembers.length]);

  const handleChange = (selectedOptions) => {
    setSelected(selectedOptions);
    setFilters({ ...filters, ["teamMembers"]: selectedOptions });
  };

  const customValueRenderer = (selected) => selected.length
    ? selected.length == teamMembers.length ? "All team members selected" : `${selected.length} members selected`
    : "All team members selected";

  return (
    <div>
      <MultiSelect
        className="w-52"
        valueRenderer={customValueRenderer}
        options={teamMembers}
        value={selected}
        onChange={handleChange}
        labelledBy={"Select"}
        isCreatable={true}
      />
    </div>
  );
};

export default SearchTeamMembers;
