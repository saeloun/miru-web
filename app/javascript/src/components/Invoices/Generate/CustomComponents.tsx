import React from "react";

import { components, DropdownIndicatorProps } from "react-select";

import { MagnifyingGlass } from "phosphor-react";

export const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
  <components.DropdownIndicator {...props}>
    <MagnifyingGlass size={20} color="#1D1A31" />
  </components.DropdownIndicator>
);

export const DropdownHeader = ({ setShowMultilineModal }) => (
  <div className="grid grid-cols-3 gap-4 p-2 items-center">
    <div className="mt-1 relative rounded-md shadow-sm col-span-2 ">
      <input
        type="search"
        className="rounded tracking-wider appearance-none border border-gray-100 block w-full px-3 py-2 bg-miru-gray-100 h-8 shadow-sm font-semibold text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-miru-gray-1000 focus:border-miru-gray-1000 sm:text-sm"
        placeholder="Search"
      />
      <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
        <MagnifyingGlass size={20} color="#1D1A31"
          className="h-3 w-3 text-miru-gray-400"
        />
      </button>
    </div>
    <div>
      <button onClick={() => setShowMultilineModal(true)} className="mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">
        CLICK TO ADD MULTIPLE ENTRIES
      </button>
    </div>
  </div>
);
