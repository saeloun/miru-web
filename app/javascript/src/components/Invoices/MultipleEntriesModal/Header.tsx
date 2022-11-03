import React from "react";

import { X } from "phosphor-react";

import Filters from "./Filters";

const Header = ({
  setMultiLineItemModal,
  teamMembers,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput,
  filterIntialValues
}) => (
  <div>
    <div className='flex justify-between px-6 pb-2 pt-6'>
      <span className='text-miru-dark-purple-1000 text-base font-extrabold'>Select Time Entries</span>
      <button
        onClick={() => setMultiLineItemModal(false)}
      >
        <X size={16} color="#CDD6DF" />
      </button>
    </div>
    <Filters
      teamMembers={teamMembers}
      filterParams={filterParams}
      setFilterParams={setFilterParams}
      selectedInput={selectedInput}
      setSelectedInput={setSelectedInput}
      filterIntialValues={filterIntialValues}
    />
  </div>
);

export default Header;
