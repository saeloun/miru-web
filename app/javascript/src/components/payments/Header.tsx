import React from "react";

import { PlusIcon } from "miruIcons";

import { HeaderProps } from "./interfaces";
import MobileHeader from "./Mobile/Header";

const Header = ({
  setShowManualEntryModal,
  payments,
  setShowSearchedPayments,
  setSearchedPaymentList,
  params,
  setParams,
  showSearchedPayments,
}: HeaderProps) => {
  const fetchSearchedPayments = (searchQuery = "") => {
    if (searchQuery?.length) {
      const searchedPaymentList = payments?.filter(payment =>
        payment?.clientName
          ?.toLowerCase()
          .trim()
          ?.startsWith(searchQuery?.toLowerCase().trim())
      );
      setSearchedPaymentList(searchedPaymentList);
      setShowSearchedPayments(true);
      setParams({ ...params, query: searchQuery });
    } else {
      setSearchedPaymentList([]);
      setShowSearchedPayments(false);
      setParams({ ...params, query: "" });
    }
  };

  return (
    <div className="mx-auto mt-6 mb-3 justify-between sm:flex sm:items-center">
      <div className="hidden md:flex">
        <h2 className="header__title">Payments</h2>
      </div>
      <div className="hidden md:flex">
        <button
          className="header__button"
          id="addEntry"
          type="button"
          onClick={() => setShowManualEntryModal(true)}
        >
          <PlusIcon size={16} weight="fill" />
          <span className="ml-2 inline-block uppercase">ADD MANUAL ENTRY</span>
        </button>
      </div>
      <MobileHeader
        fetchSearchedPayments={fetchSearchedPayments}
        params={params}
        payments={payments}
        setParams={setParams}
        setShowManualEntryModal={setShowManualEntryModal}
        setShowSearchedPayments={setShowSearchedPayments}
        showSearchedPayments={showSearchedPayments}
      />
    </div>
  );
};

export default Header;
