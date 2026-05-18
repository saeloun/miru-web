import React from "react";
import { SearchResults } from "../../../ui/search-results";
import SearchedDataRow from "./SearchedDataRow";
import { i18n } from "../../../../i18n";

const SearchDropdown = ({
  list = [],
  status,
  display,
  searchRef = null,
  searchQuery = "",
}) => (
  <SearchResults
    results={list}
    status={status}
    isOpen={display}
    containerRef={searchRef}
    renderItem={invoice => (
      <SearchedDataRow invoice={invoice} searchQuery={searchQuery} />
    )}
    emptyMessage={i18n.t("noResultsFound")}
    className="px-4"
  />
);

export default SearchDropdown;
