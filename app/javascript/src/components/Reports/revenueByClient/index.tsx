/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import Filters from "./Filters";
import { RevenueByClients } from "./interface";

import getReportData from "../api/revenueByClient";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import Header from "../Header";

const RevenueByClientReport = () => {
  const filterIntialValues = {
    // TODO: fix typo filterInitialValues
    dateRange: { label: "All", value: "" },
    clients: [{ label: "All Clients", value: "" }],
  };

  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState(0);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedInput, setSelectedInput] = useState("from-input");
  const [clientList, setClientList] = useState<Array<RevenueByClients>>([]);
  const [currency, setCurrency] = useState("");
  const [summary, setSummary] = useState({
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    sendGAPageView();
  }, []);

  const onClickInput = e => {
    setSelectedInput(e.target.name);
  };

  const updateFilterCounter = async () => {
    let counter = 0;
    for (const filter in selectedFilter) {
      const filterValue = selectedFilter[filter];
      if (Array.isArray(filterValue)) {
        counter = counter + filterValue.length;
      } else {
        if (filterValue.value !== "") {
          counter = counter + 1;
        }
      }
    }
    await setFilterCounter(counter);
  };

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
    updateFilterCounter();
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

  const handleApplyFilter = filters => {
    setSelectedFilter(filters);
  };

  const resetFilter = () => {
    setSelectedFilter(filterIntialValues);
    setIsFilterVisible(false);
    setShowNavFilters(false);
  };

  const handleDownload = () => {}; //eslint-disable-line

  const handleSelectDate = date => {
    if (selectedInput === "from-input") {
      setDateRange({ ...dateRange, ...{ from: date } });
    } else {
      setDateRange({ ...dateRange, ...{ to: date } });
    }
  };

  return (
    <div>
      <EntryContext.Provider
        value={{
          ...contextValues,
        }}
      >
        <Header
          handleDownload={handleDownload}
          isFilterVisible={isFilterVisible}
          resetFilter={resetFilter}
          setIsFilterVisible={setIsFilterVisible}
          showExportButon={false}
          showNavFilters={showNavFilters}
          type="Revenue Report"
        />
        <Container />
        {isFilterVisible && (
          <Filters
            dateRange={dateRange}
            handleApplyFilter={handleApplyFilter}
            handleSelectDate={handleSelectDate}
            resetFilter={resetFilter}
            selectedFilter={selectedFilter}
            selectedInput={selectedInput}
            setIsFilterVisible={setIsFilterVisible}
            onClickInput={onClickInput}
          />
        )}
      </EntryContext.Provider>
    </div>
  );
};

export default RevenueByClientReport;
