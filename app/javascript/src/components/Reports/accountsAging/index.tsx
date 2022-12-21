import React, { useState, useEffect } from "react";

import Container from "./Container";
import FilterSideBar from "./Filters";

import getReportData from "../api/accountsAging";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import Header from "../Header";

const AccountsAging = () => {
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState([]); //eslint-disable-line
  const [filterCounter, setFilterCounter] = useState(0); //eslint-disable-line
  const [clientList, setClientList] = useState<any>([]);
  const [totalAmount, setTotalAmount] = useState<any>({
    zero_to_thirty_days: 0,
    thirty_one_to_sixty_days: 0,
    sixty_one_to_ninety_days: 0,
    ninety_plus_days: 0,
    total: 0,
  });

  const resetFilter = () => {
    setSelectedFilter([]);
    setFilterCounter(selectedFilter.length);
    setIsFilterVisible(false);
    setShowNavFilters(false);
  };

  useEffect(() => {
    getReportData({ setClientList, setTotalAmount });
  }, []);

  const contextValues = {
    currentReport: "accountsAgingReport",
    revenueByClientReport: RevenueByClientReportContext,
    outstandingOverdueInvoice: OutstandingOverdueInvoiceContext,
    timeEntryReport: TimeEntryReportContext,
    accountsAgingReport: {
      selectedFilter: {
        clients: selectedFilter,
      },
      filterCounter,
      clientList,
      currency: "INR",
      summary: {
        zero_to_thirty_days: totalAmount?.zero_to_thirty_days || 0,
        thirty_one_to_sixty_days: totalAmount?.thirty_one_to_sixty_days || 0,
        sixty_one_to_ninety_days: totalAmount?.sixty_one_to_ninety_days || 0,
        ninety_plus_days: totalAmount?.ninety_plus_days || 0,
        total: totalAmount?.total || 0,
      },
      handleRemoveSingleFilter: (key, value) => {}, //eslint-disable-line
    },
  };

  return (
    <div className="overflow-x-scroll">
      <EntryContext.Provider value={{ ...contextValues }}>
        <Header
          handleDownload
          isFilterVisible={isFilterVisible}
          resetFilter={resetFilter}
          setIsFilterVisible={setIsFilterVisible}
          showExportButon={false}
          showNavFilters={showNavFilters}
          type="Accounts Aging Report"
        />
        <Container />
        {isFilterVisible && (
          <FilterSideBar
            resetFilter={resetFilter}
            selectedFilter={selectedFilter}
            setFilterCounter={setFilterCounter}
            setIsFilterVisible={setIsFilterVisible}
            setSelectedFilter={setSelectedFilter}
          />
        )}
      </EntryContext.Provider>
    </div>
  );
};

export default AccountsAging;
