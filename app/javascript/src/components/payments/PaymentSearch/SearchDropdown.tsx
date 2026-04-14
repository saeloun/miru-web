import React from "react";
import { SearchResults } from "../../ui/search-results";
import { i18n } from "../../../i18n";
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
      emptyMessage={i18n.t("payments.noPaymentFound")}
      className="py-4 px-2"
    />
  );
};

export default SearchDropdown;
