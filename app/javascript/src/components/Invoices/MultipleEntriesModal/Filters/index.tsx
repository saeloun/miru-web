import React, { Fragment, useState } from "react";

import SearchTeamMembers from "./SearchTeamMembers";

const Filters = ({ teamMembers, filterParams, setFilterParams }) => {
  const [filters, setFilters] = useState<any>(filterParams);

  const handleSelectFilter = (selectedValue, field) => {
    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
  };

  return (
    <Fragment>
      <SearchTeamMembers
        teamMembers={teamMembers}
        filters={filters}
        handleSelectFilter={handleSelectFilter}
      />
      <button onClick={()=>setFilterParams(filters)}>Apply</button>
    </Fragment>
  );
};

export default Filters;
