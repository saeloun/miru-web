import React from "react";
import { SearchResults } from "../../../ui/search-results";
import SearchedDataRow from "./SearchedDataRow";

const SearchDropdown = ({ list = [], status, display, searchRef = null }) => (
  <SearchResults
    results={list}
    status={status}
    isOpen={display}
    containerRef={searchRef}
    renderItem={invoice => <SearchedDataRow invoice={invoice} />}
    emptyMessage="No matching results found"
    className="px-4"
  />
);

export default SearchDropdown;
