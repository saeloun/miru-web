import React from "react";

import { ApiStatus } from "constants/index";

import SearchedDataRow from "./SearchedDataRow";

const SearchDropdown = ({ list = [], status, display }) => {
  if (!display) return null;

  if (status == ApiStatus.SUCCESS && list.length == 0) {
    return (
      <section className="absolute top-8 flex w-full items-center bg-miru-white-1000 py-2 shadow drop-shadow-md">
        <div className="mx-auto text-center">No matching results found</div>
      </section>
    );
  }

  return (
    <section className="absolute top-10.05 z-max w-full rounded-lg bg-miru-white-1000 px-4 shadow drop-shadow-md">
      {list.map(invoice => (
        <SearchedDataRow invoice={invoice} key={invoice.id} />
      ))}
    </section>
  );
};

export default SearchDropdown;
