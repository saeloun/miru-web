import React, { Fragment } from "react";
import { X } from "phosphor-react";
import { getReports } from "./fetchReport";
import { useEntry } from "../context/EntryContext";

const NavigationFilter = () => {
  const { revenueByClientReport, currentReport, timeEntryReport, outstandingOverdueInvoice, totalHoursLoggedReport } = useEntry();

  const selectedReport = getReports({ currentReport, timeEntryReport, revenueByClientReport, outstandingOverdueInvoice, totalHoursLoggedReport });

  const filterHtml = (value, key, filterKey) => (
    <li key={key} className="flex px-2 mr-4 py-1 rounded-xl tracking-widest font-semibold px-1 text-xs tracking-widest bg-miru-gray-400 text-miru-dark-purple-1000">
      <span>{filterKey === "groupBy" && "Group By:"} {value}</span>
      <button onClick={() => selectedReport.handleRemoveSingleFilter(filterKey, value)} className="inline-block ml-1">
        <X size={11} color="#1D1A31" className="inline-block" weight="bold" />
      </button>
    </li>
  );
  const getFilterValues = () => {
    let filterOptions = [];
    for (const filterKey in selectedReport.selectedFilter) {
      const filterValue = selectedReport.selectedFilter[filterKey];
      if (Array.isArray(filterValue)) {
        filterOptions = [...filterOptions, filterValue.map((item, index) => filterHtml(item.label, `${item}-${index}`, filterKey))];
      }
      else if (filterValue.value !== "") {
        filterOptions = [...filterOptions, filterHtml(filterValue.label, filterKey, filterKey)];
      }
    }
    return filterOptions;
  };

  return (
    <Fragment>
      {getFilterValues()}
    </Fragment>
  );
};
export default NavigationFilter;
