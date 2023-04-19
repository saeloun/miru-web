import React, { Fragment } from "react";

import SearchedDataRow from "./SearchedDataRow";

import { SearchDropdownProps } from "../interfaces";

const SearchDropdown = ({
  list = [],
  setSearchQuery,
  setIsClickedOnSearchOrSuggestion,
}: SearchDropdownProps) => (
  <section className="absolute top-9 w-full rounded-lg bg-miru-white-1000 py-4 px-2 shadow drop-shadow-md">
    {list?.length ? (
      list.map(suggestedPayment => (
        <Fragment key={suggestedPayment.invoiceNumber}>
          <SearchedDataRow
            setIsClickedOnSearchOrSuggestion={setIsClickedOnSearchOrSuggestion}
            setSearchQuery={setSearchQuery}
            suggestedPaymentClientName={suggestedPayment.clientName}
          />
        </Fragment>
      ))
    ) : (
      <h3 className="pt-1 text-center font-manrope text-sm font-medium leading-5 text-miru-dark-purple-400">
        No payment found!
      </h3>
    )}
  </section>
);

export default SearchDropdown;
