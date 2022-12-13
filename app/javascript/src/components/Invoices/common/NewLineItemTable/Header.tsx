import React from "react";
// import { SearchIcon } from "miruIcons";

const NewLineItemTableHeader = ({
  setShowMultilineModal,
  addManualEntryItem,
}) => (
  <div className="flex items-center justify-between px-3 pt-6 pb-2">
    {/* Commented the search box as it is intended for next release */}
    {/* <div className="mt-1 relative rounded-md shadow-sm col-span-2 ">
      <input
        type="search"
        className="rounded tracking-wider appearance-none border border-gray-100 block w-full px-3 py-2 bg-miru-gray-100 h-8 shadow-sm font-semibold text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-miru-gray-1000 focus:border-miru-gray-1000 sm:text-sm"
        placeholder="Search"
      />
      <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
        <SearchIcon size={20} color="#1D1A31"
          className="h-3 w-3 text-miru-gray-400"
        />
      </button>
    </div> */}
    <button
      className="text-xs font-bold tracking-widest text-miru-han-purple-1000"
      onClick={addManualEntryItem}
    >
      ADD MANUAL ENTRY
    </button>
    <button
      className="text-xs font-bold tracking-widest text-miru-han-purple-1000"
      onClick={() => setShowMultilineModal(true)}
    >
      CLICK TO ADD MULTIPLE ENTRIES
    </button>
  </div>
);

export default NewLineItemTableHeader;
