/* eslint-disable @typescript-eslint/no-unused-vars */
import { Toastr } from "StyledComponents";

import reports from "apis/reports/outstandingOverdueInvoice";
import { filteredReportUnmapper } from "mapper/mappedIndex";

import { getQueryParams } from "./applyFilter";

const getReportData = async ({
  outstandingOverdueInvoice,
  selectedFilter,
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
}) => {
  try {
    const res = await reports.get();
    const { currency, clients, summary } = res.data;
    setClientList(clients);
    setCurrency(currency);
    setSummary(summary);
    setShowNavFilters(true);
    setIsFilterVisible(false);
    setOptions({ ...filterOptions, clients });
    setOutstandingOverdueInvoice({
      ...outstandingOverdueInvoice,
      filterOptions: { ...filterOptions, clients },
      currency,
      clientList: clients,
      summary,
      selectedFilter,
      filterCounter: filterCounter || 0,
    });
  } catch (error) {
    Toastr.error(error.message);
  } finally {
    setLoading(false);
  }
};

export const applyFilter = async (
  outstandingOverdueInvoice = {},
  filterOptions = {},
  setCurrency,
  setClientList,
  selectedFilter = {},
  setNavFilters,
  setFilterVisibilty,
  setOutstandingOverdueInvoice = null,
  setLoading
) => {
  try {
    const queryParams = getQueryParams(selectedFilter);
    const sanitizedParam = queryParams.substring(1);
    const sanitizedQuery = `?${sanitizedParam}`;
    const res = await reports.get(sanitizedQuery);
    const sanitizedData = filteredReportUnmapper(res.data);
    const { currency, clients, summary } = sanitizedData;
    let updatedOutstandingOverdueInvoice = {};

    if (setCurrency) setCurrency(currency);

    if (setClientList) setClientList(clients || []);

    if (setNavFilters) setNavFilters(true);

    if (setFilterVisibilty) setFilterVisibilty(false);

    if (setOutstandingOverdueInvoice) {
      updatedOutstandingOverdueInvoice = {
        ...outstandingOverdueInvoice,
        filterOptions: { ...filterOptions, clients: clients || [] },
        currency,
        clientList: clients || [],
        summary: summary || {},
      };

      if (Object.keys(selectedFilter || {})?.length > 0) {
        updatedOutstandingOverdueInvoice = {
          ...updatedOutstandingOverdueInvoice,
          selectedFilter,
        };
      }
      setOutstandingOverdueInvoice(updatedOutstandingOverdueInvoice);
    }
  } catch (error) {
    Toastr.error(error.message);
  } finally {
    setLoading(false);
  }
};

export default getReportData;
