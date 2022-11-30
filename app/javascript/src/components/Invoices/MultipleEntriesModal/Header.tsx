import React from "react";

import { XIcon } from "miruIcons";

import Filters from "./Filters";

const Header = ({
  setMultiLineItemModal,
  teamMembers,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput,
  filterIntialValues,
}) => (
  <div>
    <div className="flex justify-between px-6 pb-2 pt-6">
      <span className="text-base font-extrabold text-miru-dark-purple-1000">
        Select Time Entries
      </span>
      <button onClick={() => setMultiLineItemModal(false)}>
        <XIcon color="#CDD6DF" size={16} />
      </button>
    </div>
    <Filters
      filterIntialValues={filterIntialValues}
      filterParams={filterParams}
      selectedInput={selectedInput}
      setFilterParams={setFilterParams}
      setSelectedInput={setSelectedInput}
      teamMembers={teamMembers}
    />
  </div>
);

export default Header;
