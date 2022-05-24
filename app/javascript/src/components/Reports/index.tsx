import React, { useState, useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import applyFilter from "./api/applyFilter";
import Container from "./Container";
import EntryContext from "./context/EntryContext";

import Filters from "./Filters";
import Header from "./Header";

import { ITimeEntry } from "./interface";

const Reports = () => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "" },
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

  const fetchTimeEntries = async () => {
    const res = await reports.get("");
    if (res.status == 200) {
      setTimeEntries(res.data.entries);
      getFilterOptions(res.data.filterOptions);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchTimeEntries();
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
    applyFilter(selectedFilter, setTimeEntries, setNavFilters, setFilterVisibilty);
  }, [selectedFilter]);

  const contextValues = {
    entries: timeEntries,
    filterOptions,
    selectedFilter,
    filterCounter
  };

  const handleApplyFilter = async (filters) => {
    setSelectedFilter(filters);
  };

  const resetFilter = () => {
    setSelectedFilter(filterIntialValues);
    fetchTimeEntries();
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
