import React, { useState, useEffect } from "react";

import accountsAgingApi from "apis/reports/accountsAging";
import Loader from "common/Loader/index";
import Logger from "js-logger";
import { useNavigate } from "react-router-dom";

import Container from "./Container";
import FilterSideBar from "./Filters";

import getReportData from "../api/accountsAging";
import { getQueryParams } from "../api/applyFilter";
import EntryContext from "../context/EntryContext";
import OutstandingOverdueInvoiceContext from "../context/outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "../context/RevenueByClientContext";
import TimeEntryReportContext from "../context/TimeEntryReportContext";
import Header from "../Header";

const AccountsAgingReport = () => {
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showNavFilters, setShowNavFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState([]);  
  const [filterCounter, setFilterCounter] = useState(0);  
  const [clientList, setClientList] = useState<any>([]);
  const [currency, setCurrency] = useState<string>("USD");
  const [totalAmount, setTotalAmount] = useState<any>({
    zero_to_thirty_days: 0,
    thirty_one_to_sixty_days: 0,
    sixty_one_to_ninety_days: 0,
    ninety_plus_days: 0,
    total: 0,
  });
  const navigate = useNavigate();

  const resetFilter = () => {
    setSelectedFilter([]);
    setFilterCounter(0);
    setIsFilterVisible(false);
    setShowNavFilters(false);
  };

  const fetchReportData = async () => {
    try {
      await getReportData({ setClientList, setTotalAmount, setCurrency });
      setLoading(false);
    } catch (e) {
      Logger.error(e);
      navigate("/reports");
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const contextValues = {
    currentReport: "accountsAgingReport",
    revenueByClientReport: RevenueByClientReportContext,
    outstandingOverdueInvoice: OutstandingOverdueInvoiceContext,
    timeEntryReport: TimeEntryReportContext,
    accountsAgingReport: {
      selectedFilter: {
        clients: selectedFilter,
      },
      filterCounter,
      clientList,
      currency,
      summary: {
        zero_to_thirty_days: totalAmount?.zero_to_thirty_days || 0,
        thirty_one_to_sixty_days: totalAmount?.thirty_one_to_sixty_days || 0,
        sixty_one_to_ninety_days: totalAmount?.sixty_one_to_ninety_days || 0,
        ninety_plus_days: totalAmount?.ninety_plus_days || 0,
        total: totalAmount?.total || 0,
      },
    },
  };

  const handleDownload = async type => {
    const queryParams = getQueryParams(selectedFilter).substring(1);
    const response = await accountsAgingApi.download(type, `?${queryParams}`);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    // const filename = `${selectedFilter.dateRange.label}.${type}`;
    const filename = `report.${type}`;
    link.href = url;
    link.setAttribute("download", filename);
    link.click();
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <EntryContext.Provider value={{ ...contextValues }}>
      <Header
        showExportButon
        handleDownload={handleDownload}
        isFilterVisible={isFilterVisible}
        resetFilter={resetFilter}
        revenueFilterCounter={() => {}}  
        setIsFilterVisible={setIsFilterVisible}
        showNavFilters={showNavFilters}
        type="Accounts Aging Report"
      />
      <Container />
      {isFilterVisible && (
        <FilterSideBar
          resetFilter={resetFilter}
          selectedFilter={selectedFilter}
          setFilterCounter={setFilterCounter}
          setIsFilterVisible={setIsFilterVisible}
          setSelectedFilter={setSelectedFilter}
        />
      )}
    </EntryContext.Provider>
  );
};

export default AccountsAgingReport;
