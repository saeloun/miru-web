import React, { Fragment } from "react";

import { XIcon } from "miruIcons";

import { i18n } from "../../../i18n";
import { getReports } from "./fetchReport";

import { useEntry } from "../context/EntryContext";
import { customDateFilter } from "../RevenueByClientReport/Filters/filterOptions";

const NavigationFilter = () => {
  const {
    revenueByClientReport,
    currentReport,
    timeEntryReport,
    outstandingOverdueInvoice,
    accountsAgingReport,
  } = useEntry();

  const selectedReport = getReports({
    currentReport,
    timeEntryReport,
    revenueByClientReport,
    outstandingOverdueInvoice,
    accountsAgingReport,
  });

  const filterHtml = (value, key, filterKey) => (
    <li
      className="my-1 mr-4 flex rounded-xl bg-secondary px-2 py-1 px-1 text-xs font-semibold tracking-widest tracking-widest text-foreground"
      key={key}
    >
      <span className="whitespace-nowrap">
        {filterKey === "groupBy" && `${i18n.t("reports.groupBy")}:`} {value}
      </span>
      <button
        className="ml-1 inline-block"
        onClick={() =>
          selectedReport.handleRemoveSingleFilter(filterKey, value)
        }
      >
        <XIcon
          className="inline-block"
          color="#1D1A31"
          size={11}
          weight="bold"
        />
      </button>
    </li>
  );

  const getFilterValues = () => {
    let filterOptions = [];
    for (const filterKey in selectedReport.selectedFilter) {
      const filterValue = selectedReport.selectedFilter[filterKey];
      if (filterKey === customDateFilter) {
        continue;
      } else if (Array.isArray(filterValue)) {
        filterOptions = [
          ...filterOptions,
          filterValue.map((item, index) =>
            filterHtml(item.label, `${item}-${index}`, filterKey)
          ),
        ];
      } else if (filterValue.value !== "") {
        filterOptions = [
          ...filterOptions,
          filterHtml(filterValue.label, filterKey, filterKey),
        ];
      }
    }

    return filterOptions;
  };

  return <Fragment>{getFilterValues()}</Fragment>;
};
export default NavigationFilter;
