import React from "react";

import { SearchedDataRowProps } from "../interfaces";

const SearchedDataRow = ({
  suggestedItem,
  // baseCurrency,
  // setSearchQuery,
  setSearchQuery,
  setIsClickedOnSearchOrSuggestion,
}: SearchedDataRowProps) => (
  <div
    className="flex items-center justify-between"
    onClick={() => {
      setIsClickedOnSearchOrSuggestion(true);
      setSearchQuery(suggestedItem.clientName);
    }}
  >
    <h1 className="font-manrope text-sm font-semibold leading-4 text-miru-dark-purple-1000">
      {suggestedItem.clientName}
    </h1>
    {/* <div className="pt-2 pr-6 pl-0 text-left">
        <h1 className="font-manrope text-sm font-semibold leading-4 text-miru-dark-purple-1000">
          {suggestedItem.clientName}
        </h1>
        <h3 className="pt-1 font-manrope text-xs font-medium leading-4 text-miru-dark-purple-400">
          {suggestedItem.invoiceNumber}
        </h3>
      </div>

      <div className="pt-2.125 pl-0">
        <h3 className="pt-1 font-manrope text-sm font-medium leading-5 text-miru-dark-purple-1000">
          {baseCurrency && currencyFormat(baseCurrency, suggestedItem.amount)}
        </h3>
        <h3 className="pt-1 font-manrope text-xs font-medium leading-4 text-miru-dark-purple-400">
          {suggestedItem.transactionDate}
        </h3>
      </div>
      <div className="pt-2.125 pl-0">
        <div className="text-right">
          <Badge
            className={`w-auto whitespace-nowrap uppercase ${getStatusCss(
              suggestedItem.status
            )} `}
            text={suggestedItem.status}
          />
        </div>
      </div> */}
  </div>
);

export default SearchedDataRow;
