import { ApiStatus } from "constants/index";

import React from "react";

import SearchedDataRow from "./SearchedDataRow";

const SearchDropdown = ({ list = [], status, display, searchRef = null }) => {
  if (!display) return null;

  if (status == ApiStatus.SUCCESS && list.length == 0) {
    return (
      <section
        className="absolute top-8 flex w-full items-center bg-miru-white-1000 py-2 shadow drop-shadow-md"
        ref={searchRef}
      >
        <div className="mx-auto text-center">No matching results found</div>
      </section>
    );
  }

  return (
    <section
      className="absolute top-10.05 z-max w-full overflow-scroll rounded-lg bg-miru-white-1000 px-4 shadow drop-shadow-md"
      ref={searchRef}
    >
      {list.map(invoice => (
        <SearchedDataRow invoice={invoice} key={invoice.id} />
      ))}
    </section>
  );
};

export default SearchDropdown;
