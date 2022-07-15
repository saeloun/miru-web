import React, { useState, useEffect } from "react";

import reports from "apis/reports";
import { sendGAPageView } from "utils/googleAnalytics";
import applyFilter, { getQueryParams } from "../api/applyFilter";
import Container from "../Container";
import EntryContext from "../context/EntryContext";

import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import Filters from "../Filters";
import { getMonth } from "../Filters/filterOptions";
import Header from "../Header";

import { ITimeEntry } from "../interface";

const TimeEntryReports = () => {
  const filterIntialValues = {
    dateRange: { label: getMonth(true), value: "this_week" },
    clients: [],
    teamMember: [],
    status: [],
    groupBy: { label: "None", value: "" }
  };

  const [timeEntries, setTimeEntries] = useState<Array<ITimeEntry>>([]);
  const [filterOptions, getFilterOptions] = useState({
    clients: [],
    teamMembers: []
  });
  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [isFilterVisible, setFilterVisibilty] = useState<boolean>(false);
  const [showNavFilters, setNavFilters] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState(0);

  useEffect(() => {
    sendGAPageView();
  }, []);

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

  useEffect(() => {
    updateFilterCounter();
    applyFilter(selectedFilter, setTimeEntries, setNavFilters, setFilterVisibilty, getFilterOptions);
  }, [selectedFilter]);

  const handleApplyFilter = async (filters) => {
    setSelectedFilter(filters);
  };

  const resetFilter = () => {
    setSelectedFilter(filterIntialValues);
    setFilterVisibilty(false);
    setNavFilters(false);
  };

  const handleRemoveSingleFilter = (key, value) => {
    const filterValue = selectedFilter[key];
    if (Array.isArray(filterValue)) {
      const closedFilter = filterValue.filter(item => item.label !== value);
      setSelectedFilter({ ...selectedFilter, [key]: closedFilter });
    }
    else {
      const label = key === "dateRange" ? "All" : "None";
      setSelectedFilter({ ...selectedFilter, [key]: { label, value: "" } });
    }
  };

  const handleDownload = async (type) => {
    const queryParams = getQueryParams(selectedFilter).substring(1);
    const response = await reports.download(type, `?${queryParams}`);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    const date = new Date();
    link.href = url;
    link.setAttribute("download", `${date.toISOString()}_miru_report.${type}`);
    document.body.appendChild(link);
    link.click();
  };

  const contextValues = {
    timeEntryReport: {
      reports: timeEntries,
      filterOptions,
      selectedFilter,
      filterCounter,
      handleRemoveSingleFilter: handleRemoveSingleFilter
    },
    currentReport: "TimeEntryReport",
    revenueByClientReport: RevenueByClientReportContext,
    outstandingOverdueInvoice: OutstandingOverdueInvoiceContext
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
          type={"Time entry report"}
        />
        <Container />
        {isFilterVisible && <Filters
          handleApplyFilter={handleApplyFilter}
          resetFilter={resetFilter}
          setFilterVisibilty={setFilterVisibilty}
        />}
      </EntryContext.Provider>
    </div>
  );
};

export default TimeEntryReports;
