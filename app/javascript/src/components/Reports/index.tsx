import React, { useState, useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import applyFilter, { getQueryParams } from "./api/applyFilter";
import Container from "./Container";
import EntryContext from "./context/EntryContext";

import Filters from "./Filters";
import { getMonth } from "./Filters/filterOptions";
import Header from "./Header";

import { ITimeEntry } from "./interface";

const Reports = () => {
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
    setAuthHeaders();
    registerIntercepts();
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

  const contextValues = {
    reports: timeEntries,
    filterOptions,
    selectedFilter,
    filterCounter
  };

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
    link.href = url;
    link.setAttribute("download", `report.${type}`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <EntryContext.Provider value={{
        ...contextValues,
        handleRemoveSingleFilter
      }}>
        <Header
          showNavFilters={showNavFilters}
          setFilterVisibilty={setFilterVisibilty}
          isFilterVisible={isFilterVisible}
          resetFilter={resetFilter}
          handleDownload={handleDownload}
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

export default Reports;
