import React, { useState, useEffect } from "react";

import reportsApi from "apis/reports";
import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";
import { Pagination } from "StyledComponents";
import { sendGAPageView } from "utils/googleAnalytics";

import { TimeEntryReportMobileView } from "./TimeEntryReportMobileView";
import { TIME_ENTRY_REPORT_PAGE } from "./utils";

import { applyFilter, getQueryParams } from "../api/applyFilter";
import Container from "../Container";
import AccountsAgingReportContext from "../context/AccountsAgingReportContext";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import { getMonth } from "../Filters/filterOptions";
import FilterSideBar from "../Filters/FilterSideBar";
import Header from "../Header";
import { ITimeEntry } from "../interface";

const TimeEntryReport = () => {
  const filterIntialValues = {
    dateRange: { label: getMonth(true), value: "this_month" },
    clients: [],
    teamMember: [],
    status: [],
    groupBy: { label: "Client", value: "client" },
    customDateFilter: {
      from: "",
      to: "",
    },
  };
  const { isDesktop } = useUserContext();

  const [timeEntries, setTimeEntries] = useState<Array<ITimeEntry>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState({
    clients: [],
    teamMembers: [],
    projects: [],
  });

  const [groupByTotalDuration, setGroupByTotalDuration] = useState({
    groupBy: "",
    groupedDurations: {},
  });
  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState(0);
  const [selectedInput, setSelectedInput] = useState<string>("from-input");

  const [paginationDetails, setPaginationDetails] = useState({
    page: 0,
    pages: 0,
    first: true,
    prev: 0,
    next: 0,
    last: false,
  });

  useEffect(() => {
    sendGAPageView();
  }, []);

  const updateFilterCounter = async () => {
    let counter = 0;
    for (const filterkey in selectedFilter) {
      const filterValue = selectedFilter[filterkey];
      if (filterkey == "customDateFilter") {
        continue;
      } else if (Array.isArray(filterValue)) {
        counter = counter + filterValue.length;
      } else {
        if (filterValue?.value) {
          counter = counter + 1;
        }
      }
    }
    await setFilterCounter(counter);
  };

  useEffect(() => {
    updateFilterCounter();
    applyFilter(
      selectedFilter,
      setTimeEntries,
      setShowNavFilters,
      setIsFilterVisible,
      setFilterOptions,
      setPaginationDetails,
      setGroupByTotalDuration,
      setLoading
    );
  }, [selectedFilter]);

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setIsFilterVisible(false);
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  const handleApplyFilter = filters => {
    setSelectedFilter(filters);
  };

  const resetFilter = () => {
    setSelectedFilter(filterIntialValues);
    setShowNavFilters(false);
  };

  const handleRemoveSingleFilter = (key, value) => {
    const filterValue = selectedFilter[key];
    if (Array.isArray(filterValue)) {
      const closedFilter = filterValue.filter(item => item.label !== value);
      setSelectedFilter({ ...selectedFilter, [key]: closedFilter });
    } else {
      if (key === "dateRange") {
        setSelectedFilter({
          ...selectedFilter,
          [key]: filterIntialValues.dateRange,
        });
      } else if (key === "groupBy") {
        setSelectedFilter({
          ...selectedFilter,
          [key]: filterIntialValues.groupBy,
        });
      } else {
        const label = "None";
        setSelectedFilter({ ...selectedFilter, [key]: { label, value: "" } });
      }
    }
  };

  const handleDownload = async type => {
    const queryParams = getQueryParams(selectedFilter).substring(1);
    const response = await reportsApi.download(type, `?${queryParams}`);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    const filename = `${selectedFilter.dateRange.label}.${type}`;
    link.href = url;
    link.setAttribute("download", filename);
    link.click();
  };

  const handlePageClick = async page => {
    if (page == "...") return;
    setLoading(true);

    const queryParams = getQueryParams(selectedFilter);
    const sanitizedParam = queryParams.substring(1);
    const sanitizedQuery = `?${sanitizedParam}`;
    const res = await reportsApi.get(`${sanitizedQuery}&page=${page}`);

    if (res.data.reports.length === 0) {
      setPaginationDetails(res.data.pagy);
      setLoading(false);
    } else {
      setTimeEntries(res.data.reports);
      setPaginationDetails(res.data.pagy);
      setLoading(false);
    }
  };

  const contextValues = {
    timeEntryReport: {
      reports: timeEntries,
      filterOptions,
      groupByTotalDuration,
      selectedFilter: {
        ...selectedFilter,
        customDateFilter: {
          from: "",
          to: "",
        },
      },
      filterCounter,
      handleRemoveSingleFilter,
    },

    currentReport: "TimeEntryReport",
    revenueByClientReport: RevenueByClientReportContext,
    outstandingOverdueInvoice: OutstandingOverdueInvoiceContext,
    accountsAgingReport: AccountsAgingReportContext,
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-full">
      <EntryContext.Provider
        value={{
          ...contextValues,
        }}
      >
        <Header
          showExportButon
          handleDownload={handleDownload}
          isFilterVisible={isFilterVisible}
          resetFilter={resetFilter}
          revenueFilterCounter={() => {}}
          setIsFilterVisible={setIsFilterVisible}
          showNavFilters={isDesktop && showNavFilters}
          type={TIME_ENTRY_REPORT_PAGE}
        />
        {isDesktop ? (
          <>
            <Container selectedFilter={selectedFilter} />
            <Pagination
              currentPage={paginationDetails?.page}
              handleClick={handlePageClick}
              isFirstPage={paginationDetails?.first}
              isLastPage={paginationDetails?.last}
              nextPage={paginationDetails?.next}
              prevPage={paginationDetails?.prev}
              totalPages={paginationDetails?.pages}
            />
          </>
        ) : (
          <TimeEntryReportMobileView
            handlePageClick={handlePageClick}
            paginationDetails={paginationDetails}
          />
        )}
        {isFilterVisible && (
          <FilterSideBar
            handleApplyFilter={handleApplyFilter}
            resetFilter={resetFilter}
            selectedFilter={selectedFilter}
            selectedInput={selectedInput}
            setFilterCounter={setFilterCounter}
            setIsFilterVisible={setIsFilterVisible}
            setSelectedInput={setSelectedInput}
          />
        )}
      </EntryContext.Provider>
    </div>
  );
};

export default TimeEntryReport;
