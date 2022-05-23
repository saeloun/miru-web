import React, { useState, useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import applyFilter from "./api/applyFilter";
import Container from "./Container";
import EntryContext from "./context/EntryContext";

import Filters from "./Filters";
import Header from "./Header";

import { ITimeEntry } from "./interface";
import dayjs from "dayjs";

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

  useEffect(() => {
    applyFilter(selectedFilter, setTimeEntries, setNavFilters, setFilterVisibilty);
  }, [selectedFilter]);

  const contextValues = {
    entries: timeEntries,
    filterOptions,
    selectedFilter
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
