/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import { LocalStorageKeys } from "constants/index";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import Filters from "./Filters";
import { RevenueByClients } from "./interface";

import getReportData from "../api/revenueByClient";
import AccountsAgingReportContext from "../context/AccountsAgingReportContext";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import Header from "../Header";

const RevenueByClientReport = () => {
  const filterIntialValues = {
    // TODO: fix typo filterInitialValues
    dateRange: { label: "All", value: "all", from: "", to: "" },
    clients: [{ label: "All Clients", value: "" }],
  };

  const LS_REVENUE_FILTERS = window.localStorage.getItem(
    LocalStorageKeys.REVENUE_FILTERS
  );

  const [selectedFilter, setSelectedFilter] = useState<any>(
    JSON.parse(LS_REVENUE_FILTERS) || filterIntialValues
  );
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState(0);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedInput, setSelectedInput] = useState("from-input");
  const [clientList, setClientList] = useState<Array<RevenueByClients>>([]);
  const [currency, setCurrency] = useState("");
  const [summary, setSummary] = useState({
    totalPaidAmount: 0,
    totalOutstandingAmount: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    sendGAPageView();
    window.localStorage.removeItem(LocalStorageKeys.REVENUE_FILTERS);
    setSelectedFilter(filterIntialValues);
  }, []);

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setIsFilterVisible(false);
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  const handleRemoveSingleFilter = (key, value) => {
    const filterValue = selectedFilter[key];

    if (Array.isArray(filterValue) && filterValue.length > 1) {
      const closedFilter = filterValue.filter(item => item.label !== value);
      setSelectedFilter({ ...selectedFilter, [key]: closedFilter });
    } else {
      const label = key === "dateRange" ? "All" : "All Clients";
      setSelectedFilter(prevState => ({
        ...prevState,
        [key]:
          key === "dateRange" ? { label, value: "" } : [{ label, value: "" }],
      }));
    }
  };

  useEffect(() => {
    getReportData({
      selectedFilter,
      setClientList,
      setShowNavFilters,
      setIsFilterVisible,
      setSummary,
      setCurrency,
      customDate: dateRange,
    });
  }, [selectedFilter]);

  const contextValues = {
    timeEntryReport: TimeEntryReportContext,
    outstandingOverdueInvoice: OutstandingOverdueInvoiceContext,
    accountsAgingReport: AccountsAgingReportContext,
    revenueByClientReport: {
      filterOptions: {
        clients: [{ label: "All Clients", value: "" }],
      },
      selectedFilter,
      customDateFilter: {
        from: dateRange.from,
        to: dateRange.to,
      },
      filterCounter,
      clientList,
      handleRemoveSingleFilter: handleRemoveSingleFilter, //eslint-disable-line
      currency,
      summary,
    },
    currentReport: "RevenueByClientReport",
  };

  const resetFilter = () => {
    setSelectedFilter(filterIntialValues);
    setIsFilterVisible(false);
    setShowNavFilters(false);
    window.localStorage.removeItem(LocalStorageKeys.REVENUE_FILTERS);
    setFilterCounter(0);
  };

  const handleDownload = () => {}; //eslint-disable-line

  return (
    <div className="h-full">
      <EntryContext.Provider
        value={{
          ...contextValues,
        }}
      >
        <Header
          handleDownload={handleDownload}
          isFilterVisible={isFilterVisible}
          resetFilter={resetFilter}
          revenueFilterCounter={filterCounter}
          setIsFilterVisible={setIsFilterVisible}
          showExportButon={false}
          showFilterIcon={undefined}
          showNavFilters={showNavFilters}
          type="Revenue Report"
        />
        <Container />
        {isFilterVisible && (
          <Filters
            dateRange={dateRange}
            filterParams={selectedFilter}
            resetFilter={resetFilter}
            selectedInput={selectedInput}
            setDateRange={setDateRange}
            setFilterCounter={setFilterCounter}
            setFilterParams={setSelectedFilter}
            setIsFilterVisible={setIsFilterVisible}
            setSelectedFilter={setSelectedFilter}
            setSelectedInput={setSelectedInput}
          />
        )}
      </EntryContext.Provider>
    </div>
  );
};

export default RevenueByClientReport;
