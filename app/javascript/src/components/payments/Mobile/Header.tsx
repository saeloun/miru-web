import React from "react";

import { PlusIcon } from "miruIcons";

import { MobileHeaderProps } from "../interfaces";
import PaymentSearch from "../PaymentSearch";

const MobileHeader = ({
  payments,
  showSearchedPayments,
  fetchSearchedPayments,
  setShowSearchedPayments,
  setShowManualEntryModal,
  params,
  setParams,
}: MobileHeaderProps) => (
  <div className="flex md:hidden">
    <PaymentSearch
      params={params}
      searchAction={fetchSearchedPayments}
      searchList={payments}
      setParams={setParams}
      setShowSearchedPayments={setShowSearchedPayments}
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

export default MobileHeader;
