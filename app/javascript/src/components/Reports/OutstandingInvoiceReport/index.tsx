/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";

import Logger from "js-logger";
import { useNavigate } from "react-router-dom";

import Loader from "common/Loader/index";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import Filters from "./Filters";
import { OutstandingOverdueInvoice } from "./interface";

import getReportData from "../api/outstandingOverdueInvoice";
import AccountsAgingReportContext from "../context/AccountsAgingReportContext";
import EntryContext from "../context/EntryContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import Header from "../Header";

const OutstandingInvoiceReport = () => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "" },
    clients: [],
  };

  const [selectedFilter, setSelectedFilter] = useState(filterIntialValues);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCounter, setFilterCounter] = useState(0); // eslint-disable-line
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
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
  const navigate = useNavigate();

  useEffect(() => {
    sendGAPageView();
  }, []);

  const onClickInput = e => {
    setSelectedInput(e.target.name);
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

  const fetchReportData = async () => {
    try {
      await getReportData({
        setClientList,
        setShowNavFilters,
        setIsFilterVisible,
        setSummary,
        setCurrency,
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
    revenueByClientReport: RevenueByClientReportContext,
    accountsAgingReport: AccountsAgingReportContext,
    outstandingOverdueInvoice: {
      filterOptions: {
        clients: [],
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
    currentReport: "outstandingOverdueInvoiceReport",
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
      setDateRange({ ...dateRange, from: date });
    } else {
      setDateRange({ ...dateRange, to: date });
    }
  };

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
        handleDownload={handleDownload}
        isFilterVisible={isFilterVisible}
        resetFilter={resetFilter}
        revenueFilterCounter={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
        setIsFilterVisible={setIsFilterVisible}
        showExportButon={false}
        showFilterIcon={false}
        showNavFilters={showNavFilters}
        type="Invoices Report"
      />
      <Container />
      {false && (
        <Filters
          dateRange={dateRange}
          handleApplyFilter={handleApplyFilter}
          handleSelectDate={handleSelectDate}
          resetFilter={resetFilter}
          selectedInput={selectedInput}
          setIsFilterVisible={setIsFilterVisible}
          onClickInput={onClickInput}
        />
      )}
    </EntryContext.Provider>
  );
};

export default OutstandingInvoiceReport;
