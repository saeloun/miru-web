/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";

import Logger from "js-logger";
import { useNavigate } from "react-router-dom";

import Loader from "common/Loader/index";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import { OutstandingOverdueInvoice } from "./interface";
import {
  filterIntialValues,
  initialFilterOptions,
  OUTSTANDING_INVOICE_REPORT_PAGE,
} from "./utils";

import getReportData, { applyFilter } from "../api/outstandingOverdueInvoice";
import AccountsAgingReportContext from "../context/AccountsAgingReportContext";
import EntryContext from "../context/EntryContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import FilterSidebar from "../Filters/FilterSideBar";
import Header from "../Header";

const OutstandingInvoiceReport = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState(0); // eslint-disable-line
  const [dateRange, setDateRange] = useState({ from: "", to: "" }); // eslint-disable-line no-unused-vars
  const [selectedInput, setSelectedInput] = useState("from-input");
  const [clientList, setClientList] = useState<
    Array<OutstandingOverdueInvoice>
  >([]);
  const [currency, setCurrency] = useState("");
  const [summary, setSummary] = useState({
    totalInvoiceAmount: 0,
    totalOutstandingAmount: 0,
    totalOverdueAmount: 0,
  });

  const [outstandingOverdueInvoice, setOutstandingOverdueInvoice] = useState({
    filterOptions,
    selectedFilter: {
      ...selectedFilter,
      customDateFilter: {
        from: "",
        to: "",
      },
    },
    customDateFilter: {
      from: dateRange?.from || "",
      to: dateRange?.to || "",
    },
    filterCounter,
    clientList,
    handleRemoveSingleFilter: handleRemoveSingleFilter, //eslint-disable-line
    currency,
    summary,
  });

  useEffect(() => {
    sendGAPageView();
  }, []);

  const updateFilterCounter = selectedFilter => {
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
    setFilterCounter(counter);
  };

  function handleRemoveSingleFilter(key, value, selectedReport: any = {}) {
    const { selectedFilter } = selectedReport || {};

    if (!selectedFilter) return;
    const filterValue = selectedFilter[key];
    let updatedSelectedFilter = { ...selectedFilter };

    if (Array.isArray(filterValue)) {
      const closedFilter = filterValue.filter(item => {
        value = value?.toLowerCase()?.trim();
        const itemName = item?.name?.toLowerCase()?.trim();

        return itemName !== value;
      });

      updatedSelectedFilter = { ...selectedFilter, [key]: closedFilter };
    } else {
      const label = key === "dateRange" ? "All" : "None";
      updatedSelectedFilter = {
        ...selectedFilter,
        [key]: { label, value: "" },
      };
    }
    handleApplyFilter(updatedSelectedFilter);
    setSelectedFilter(updatedSelectedFilter);
  }

  const fetchReportData = async () => {
    try {
      setLoading(true);
      await getReportData({
        outstandingOverdueInvoice,
        selectedFilter: filterIntialValues,
        filterCounter,
        filterOptions,
        setClientList,
        setShowNavFilters,
        setIsFilterVisible,
        setSummary,
        setCurrency,
        setOptions,
        setOutstandingOverdueInvoice,
        setLoading,
      });
    } catch (e) {
      Logger.error(e);
      navigate("/reports");
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const setOptions = options => {
    setFilterOptions(options);
  };

  useEffect(() => {
    const tempOutstandingOverdueInvoice = {
      ...outstandingOverdueInvoice,
      clientList,
      filterOptions: { ...filterOptions, clientList },
      filterCounter,
    };
    setOutstandingOverdueInvoice({ ...tempOutstandingOverdueInvoice });
  }, [clientList, filterCounter]);

  const contextValues = {
    timeEntryReport: TimeEntryReportContext,
    revenueByClientReport: RevenueByClientReportContext,
    accountsAgingReport: AccountsAgingReportContext,
    outstandingOverdueInvoice,
    currentReport: "outstandingOverdueInvoiceReport",
  };

  const handleApplyFilter = async filters => {
    try {
      setSelectedFilter(filters);
      updateFilterCounter(filters);
      setLoading(true);
      await applyFilter(
        outstandingOverdueInvoice,
        filterOptions,
        setCurrency,
        setClientList,
        filters,
        setShowNavFilters,
        setIsFilterVisible,
        setOutstandingOverdueInvoice,
        setLoading
      );
    } catch (e) {
      Logger.error(e);
    }
  };

  const resetFilter = () => {
    setSelectedFilter({ ...filterIntialValues });
    setIsFilterVisible(false);
    setShowNavFilters(false);
    setFilterCounter(0);
    fetchReportData();
  };

  const handleDownload = () => {}; //eslint-disable-line

  if (loading) {
    return <Loader />;
  }

  return (
    <EntryContext.Provider
      value={{
        ...contextValues,
      }}
    >
      <Header
        showFilterIcon
        handleDownload={handleDownload}
        isFilterVisible={isFilterVisible}
        resetFilter={resetFilter}
        revenueFilterCounter={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
        setIsFilterVisible={setIsFilterVisible}
        showExportButon={false}
        showNavFilters={showNavFilters}
        type={OUTSTANDING_INVOICE_REPORT_PAGE}
      />
      <Container />
      {isFilterVisible && (
        <FilterSidebar
          handleApplyFilter={handleApplyFilter}
          isTimeEntryFilter={false}
          resetFilter={resetFilter}
          selectedFilter={selectedFilter}
          selectedInput={selectedInput}
          setFilterCounter={setFilterCounter}
          setIsFilterVisible={setIsFilterVisible}
          setSelectedInput={setSelectedInput}
        />
      )}
    </EntryContext.Provider>
  );
};

export default OutstandingInvoiceReport;
