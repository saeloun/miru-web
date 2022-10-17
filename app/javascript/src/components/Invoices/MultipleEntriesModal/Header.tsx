import React from "react";

import { X, MagnifyingGlass } from "phosphor-react";

import Filters from "./Filters";

const Header = ({ setMultiLineItemModal, teamMembers, filterParams, setFilterParams }) => (
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
      <Filters
        teamMembers={teamMembers}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
      />
    </div>
  </div>
);

export default Header;
