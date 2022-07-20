/* eslint-disable no-console */
import React, { useState, useEffect } from "react";

import TotalHoursSection from "./TotalHoursSection";
import applyFilter from "../api/applyFilter";
import Container from "../Container";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import { getMonth } from "../Filters/filterOptions";
import Header from "../Header";
import { ITimeEntry } from "../interface";

const TotalHoursReport = () => {
  const filterIntialValues = {
    dateRange: { label: getMonth(true), value: "this_week" },
    clients: [],
    groupBy: { label: "Project", value: "project" }
  };

  const [timeEntries, setTimeEntries] = useState<Array<ITimeEntry>>([]);
  const [filterOptions, getFilterOptions] = useState({
    clients: []
  });
  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [filterCounter, setFilterCounter] = useState(0);
  const [showNavFilters, setNavFilters] = useState<boolean>(false);
  const [isFilterVisible, setFilterVisibilty] = useState<boolean>(false);

  useEffect(() => {
    updateFilterCounter();
    applyFilter(selectedFilter, setTimeEntries, setNavFilters, setFilterVisibilty, getFilterOptions);
  }, [selectedFilter]);

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
    }
    else {
      const label = key === "dateRange" ? "All" : "None";
      setSelectedFilter({ ...selectedFilter, [key]: { label, value: "" } });
    }
  };

  const contextValues = {
    timeEntryReport: TimeEntryReportContext,
    revenueByClientReport: RevenueByClientReportContext,
    currentReport: "TotalHoursLoggedReport",
    totalHoursLoggedReport: {
      reports: timeEntries,
      filterOptions,
      selectedFilter,
      filterCounter,
      handleRemoveSingleFilter: handleRemoveSingleFilter
    },
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
          isFilterVisible={isFilterVisible} // eslint-disable-line  @typescript-eslint/no-empty-function
          resetFilter={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
          handleDownload={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
          type={"Total Hours Logged"}
        />
        {timeEntries.length > 0 && (<TotalHoursSection reports={timeEntries}/>)}
        <Container />
      </EntryContext.Provider>
    </div>
  );
};

export default TotalHoursReport;
