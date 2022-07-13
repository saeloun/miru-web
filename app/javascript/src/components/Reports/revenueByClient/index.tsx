/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import { sendGAPageView } from "utils/googleAnalytics";
import Container from "./Container";

import Filters from "./Filters";
import { RevenueByClients } from "./interface";
import getReportData from "../api/revenueByClient";
import EntryContext from "../context/EntryContext";

import TimeEntryReportContext from "../context/TimeEntryReportContext";
import TotalHoursLoggedReportContext from "../context/TotalHoursLoggedReportContext";
import Header from "../Header";

const RevenueByClientReport = () => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "" },
    clients: [{ label: "All Clients", value: "" }]
  };

  const [filterOptions, getFilterOptions] = useState({ clients: [] }); //eslint-disable-line
  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [isFilterVisible, setFilterVisibilty] = useState<boolean>(false);
  const [showNavFilters, setNavFilters] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState(0);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedInput, setSelectedInput] = useState("from-input");
  const [clientList, setClientList] = useState<Array<RevenueByClients>>([]);
  const [currency, setCurrency] = useState("");
  const [summary, setSummary] = useState({
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    sendGAPageView();
  }, []);

  const onClickInput = (e) => {
    setSelectedInput(e.target.name);
  };

  const updateFilterCounter = async () => {
    let counter = 0;
    for (const filterkey in selectedFilter) {
      const filterValue = selectedFilter[filterkey];
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
    if (Array.isArray(filterValue)) {
      const closedFilter = filterValue.filter(item => item.label !== value);
      setSelectedFilter({ ...selectedFilter, [key]: closedFilter });
    } else {
      const label = key === "dateRange" ? "All" : "None";
      setSelectedFilter({ ...selectedFilter, [key]: { label, value: "" } });
    }
  };

  useEffect(() => {
    updateFilterCounter();
    getReportData({ selectedFilter, setClientList, setNavFilters, setFilterVisibilty, setSummary, setCurrency });
  }, [selectedFilter]);

  const contextValues = {
    totalHoursLoggedReport: TotalHoursLoggedReportContext,
    timeEntryReport: TimeEntryReportContext,
    revenueByClientReport: {
      filterOptions: {
        clients: [{ label: "All Clients", value: "" }]
      },
      selectedFilter: selectedFilter,
      customDateFilter: {
        from: dateRange.from,
        to: dateRange.to
      },
      filterCounter: filterCounter,
      clientList: clientList,
      handleRemoveSingleFilter: handleRemoveSingleFilter, //eslint-disable-line
      currency: currency,
      summary: summary
    },
    currentReport: "RevenueByClientReport"
  };

  const handleApplyFilter = (filters) => {
    setSelectedFilter(filters);
  };

  const resetFilter = () => {
    setSelectedFilter(filterIntialValues);
    setFilterVisibilty(false);
    setNavFilters(false);
  };

  const handleDownload = () => {}; //eslint-disable-line

  const handleSelectDate = (date) => {
    if (selectedInput === "from-input") {
      setDateRange({ ...dateRange, ...{ from: date } });
    } else {
      setDateRange({ ...dateRange, ...{ to: date } });
    }
  };

  return (
    <div>
      <EntryContext.Provider value={{
        ...contextValues
      }}>
        <Header
          showNavFilters={showNavFilters}
          setFilterVisibilty={setFilterVisibilty}
          isFilterVisible={isFilterVisible}
          resetFilter={resetFilter}
          handleDownload={handleDownload}
          type={"Revenue By Client"}
        />
        <Container />
        {isFilterVisible && <Filters
          handleApplyFilter={handleApplyFilter}
          resetFilter={resetFilter}
          setFilterVisibilty={setFilterVisibilty}
          onClickInput={onClickInput}
          handleSelectDate={handleSelectDate}
          selectedInput={selectedInput}
          dateRange={dateRange}
        />}
      </EntryContext.Provider>
    </div>
  );
};

export default RevenueByClientReport;
