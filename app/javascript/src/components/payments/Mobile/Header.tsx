import React from "react";

import { PlusIcon } from "miruIcons";

import { MobileHeaderProps } from "../interfaces";
import PaymentSearch from "../PaymentSearch";

const Header = ({
  payments,
  showSearchedPayments,
  fetchSearchedPayments,
  setShowSearchedPayments,
  setShowManualEntryModal,
  params,
  setParams,
  baseCurrency,
}: MobileHeaderProps) => (
  <div className="flex md:hidden">
    <PaymentSearch
      baseCurrency={baseCurrency}
      params={params}
      searchAction={fetchSearchedPayments}
      searchList={payments}
      setIsSearching={setShowSearchedPayments}
      setParams={setParams}
      showSearchedPayments={showSearchedPayments}
    />
    <div>
      <button
        className="ml-2 rounded border border-miru-han-purple-1000 p-3"
        onClick={() => setShowManualEntryModal(true)}
      >
        <PlusIcon color="#5B34EA" size={16} weight="bold" />
      </button>
    </div>
  </div>
);

export default Header;
