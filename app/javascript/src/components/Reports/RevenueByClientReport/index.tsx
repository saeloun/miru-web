/* eslint-disable @typescript-eslint/no-var-requires */
import { LocalStorageKeys } from "constants/index";

import React, { useState, useEffect } from "react";

import clientRevenueApi from "apis/reports/clientRevenue";
import Loader from "common/Loader/index";
import Logger from "js-logger";
import { useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import Filters from "./Filters";
import { RevenueByClients } from "./interface";

import { getQueryParams } from "../api/applyFilter";
import getReportData from "../api/revenueByClient";
import AccountsAgingReportContext from "../context/AccountsAgingReportContext";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import Header from "../Header";

const RevenueByClientReport = () => {
  const filterIntialValues = {
    // TODO: fix typo filterInitialValues
    dateRange: { label: "All Time", value: "all_time", from: "", to: "" },
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
  const [loading, setLoading] = useState<boolean>(false);
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
  const navigate = useNavigate();

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

  const fetchReportData = async () => {
    setLoading(true);
    try {
      await getReportData({
        selectedFilter,
        setClientList,
        setShowNavFilters,
        setIsFilterVisible,
        setSummary,
        setCurrency,
        customDate: dateRange,
      });
      setLoading(false);
    } catch (e) {
      Logger.error(e);
      navigate("/reports");
    }
  };

  useEffect(() => {
    fetchReportData();
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

  const handleDownload = async type => {
    const queryParams = getQueryParams(selectedFilter).substring(1);
    const response = await clientRevenueApi.download(type, `?${queryParams}`);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    const filename = `report.${type}`;
    link.href = url;
    link.setAttribute("download", filename);
    link.click();
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
          revenueFilterCounter={filterCounter}
          setIsFilterVisible={setIsFilterVisible}
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
