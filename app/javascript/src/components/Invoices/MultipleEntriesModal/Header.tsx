import React, { useState } from "react";

import { X, MagnifyingGlass } from "phosphor-react";

import FilterSelect from "./FilterSelect";
import SearchTeamMembers from "./SearchTeamMembers";

const Header = ({ setMultiLineItemModal, teamMembers, filterParams, setFilterParams }) => {
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
    <div>
      <div className='flex justify-between px-6 pb-2 pt-6'>
        <span className='text-miru-dark-purple-1000 text-base font-extrabold'>Select Time Entries</span>
        <button
          onClick={() => setMultiLineItemModal(false)}
        >
          <X size={16} color="#CDD6DF" />
        </button>
      </div>
      <div className='flex justify-between px-6 py-2'>
        <div className="w-2/5 relative flex">
          <input type="text" placeholder='Search' className='p-2 w-full bg-miru-gray-100 text-sm font-medium rounded focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000' />
          <MagnifyingGlass size={16} color="#1D1A31" className="absolute right-3 mt-3" />
        </div>
        <SearchTeamMembers
          teamMembers={teamMembers}
          filters={filters}
          handleSelectFilter={handleSelectFilter}
        />
        <FilterSelect
          option={[{ value: "All", label: "All" }, { value: "Billed", label: "Billed" }, { value: "UnBilled", label: "Unbilled" }]}
          placeholder="Time Period"
        />
        <button onClick={()=>setFilterParams(filters)}>Apply</button>
      </div>
    </div>
  );
};

export default Header;
