import React from "react";
import { SearchResults } from "../../ui/search-results";
import SearchedDataRow from "./SearchedDataRow";

import { SearchDropdownProps } from "../interfaces";

const SearchDropdown = ({
  list = [],
  setSearchQuery,
  setIsClickedOnSearchOrSuggestion,
}: SearchDropdownProps) => {
  const hasResults = list && list.length > 0;

  return (
    <SearchResults
      results={list}
      isOpen={true}
      renderItem={suggestedPayment => (
        <SearchedDataRow
          key={suggestedPayment.invoiceNumber}
          setIsClickedOnSearchOrSuggestion={setIsClickedOnSearchOrSuggestion}
          setSearchQuery={setSearchQuery}
          suggestedPaymentClientName={suggestedPayment.clientName}
        />
      )}
      emptyMessage="No payment found!"
      className="py-4 px-2"
    />
  );
};

export default SearchDropdown;
