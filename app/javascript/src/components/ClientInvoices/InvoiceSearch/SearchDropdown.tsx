import React from "react";
import { SearchResults } from "../../ui/search-results";
import SearchedDataRow from "./SearchedDataRow";

const SearchDropdown = ({ list = [], status, display, searchQuery = "" }) => (
  <SearchResults
    results={list}
    status={status}
    isOpen={display}
    renderItem={invoice => (
      <SearchedDataRow invoice={invoice} searchQuery={searchQuery} />
    )}
    emptyMessage="No matching results found"
    className="px-4"
  />
);

export default SearchDropdown;
