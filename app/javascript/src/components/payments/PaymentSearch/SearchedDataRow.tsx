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
    <h1 className="font-sans text-sm font-semibold leading-4 text-foreground">
      {suggestedPaymentClientName}
    </h1>
  </div>
);

export default SearchedDataRow;
