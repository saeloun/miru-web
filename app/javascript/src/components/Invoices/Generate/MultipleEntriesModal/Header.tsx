import React from "react";

import { X } from "phosphor-react";
import FilterSelect from "./FilterSelect";

const Header = ({ setShowMultilineModal }) => (
  <div>
    <div className='flex justify-between px-6 pb-2 pt-6'>
      <span className='text-miru-dark-purple-1000 text-base font-extrabold'>Select Time Entries</span>
      <button
        onClick={() => setShowMultilineModal(false)}
      >
        <X size={16} color="#CDD6DF" />
      </button>
    </div>
    <div className='flex justify-between px-6 py-2'>
      <input type="text" placeholder='Search' className='p-2 w-2/5 bg-miru-gray-100 text-sm font-medium rounded ' />
      <FilterSelect
        option={[{ value: "All", label: "All" }, { value: "Billed", label: "Billed" }, { value: "UnBilled", label: "Unbilled" }]}
        placeholder="Billing Status"
      />
      <FilterSelect
        option={[{ value: "All", label: "All" }, { value: "Billed", label: "Billed" }, { value: "UnBilled", label: "Unbilled" }]}
        placeholder="Team Members"
      />
      <FilterSelect
        option={[{ value: "All", label: "All" }, { value: "Billed", label: "Billed" }, { value: "UnBilled", label: "Unbilled" }]}
        placeholder="Time Period"
      />
    </div>
  </div>
);

export default Header;
