import React from "react";

import { SearchedDataRowProps } from "../interfaces";

const SearchedDataRow = ({
  suggestedPayment,
  setSearchQuery,
  setIsClickedOnSearchOrSuggestion,
}: SearchedDataRowProps) => (
  <div
    className="flex items-center justify-between"
    onClick={() => {
      setIsClickedOnSearchOrSuggestion(true);
      setSearchQuery(suggestedPayment.clientName);
    }}
  >
    <h1 className="font-manrope text-sm font-semibold leading-4 text-miru-dark-purple-1000">
      {suggestedPayment.clientName}
    </h1>
  </div>
);

export default SearchedDataRow;
