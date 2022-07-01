import * as React from "react";
import { ApiStatus } from "constants/index";
import SearchedDataRow from "./SearchedDataRow";

const SearchDropdown = ({ list=[], status }) => {

  if (status == ApiStatus.SUCCESS  && list.length == 0) {
    return (
      <section className="absolute top-8 drop-shadow-md shadow top-1 w-full bg-miru-white-1000">
      No result
      </section>
    );
  }

  return (
    <section className="absolute rounded-lg top-9 drop-shadow-md shadow w-full bg-miru-white-1000">
      { list.map(invoice => (
        <SearchedDataRow invoice= {invoice} key={invoice.id} />
      ))}
    </section>
  );
};

export default SearchDropdown;
