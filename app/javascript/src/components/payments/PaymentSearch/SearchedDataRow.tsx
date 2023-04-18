import React from "react";

import { SearchedDataRowProps } from "../interfaces";

const SearchedDataRow = ({
  setSearchQuery,
  suggestedPaymentClientName,
  setIsClickedOnSearchOrSuggestion,
}: SearchedDataRowProps) => (
  <div
    className="flex items-center justify-between"
    onClick={() => {
      setIsClickedOnSearchOrSuggestion(true);
      setSearchQuery(suggestedPaymentClientName);
    }}
  >
    <h1 className="font-manrope text-sm font-semibold leading-4 text-miru-dark-purple-1000">
      {suggestedPaymentClientName}
    </h1>
  </div>
);

export default SearchedDataRow;
