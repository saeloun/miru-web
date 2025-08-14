import React from "react";

import { AnimatePresence, motion } from "framer-motion";
import AnimatedFilterBadge from "components/ui/animated-filter-badge";

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

  const filterHtml = (value, key, filterKey, index = 0) => (
    <AnimatedFilterBadge
      key={key}
      label={filterKey}
      value={value}
      filterKey={filterKey}
      index={index}
      onRemove={() => selectedReport.handleRemoveSingleFilter(filterKey, value)}
    />
  );

  const getFilterValues = () => {
    let filterOptions = [];
    let globalIndex = 0;

    for (const filterKey in selectedReport.selectedFilter) {
      const filterValue = selectedReport.selectedFilter[filterKey];
      if (filterKey === customDateFilter) {
        continue;
      } else if (Array.isArray(filterValue)) {
        filterOptions = [
          ...filterOptions,
          filterValue.map((item, index) =>
            filterHtml(
              item.label,
              `${item.label}-${index}`,
              filterKey,
              globalIndex++
            )
          ),
        ];
      } else if (filterValue.value !== "") {
        filterOptions = [
          ...filterOptions,
          filterHtml(filterValue.label, filterKey, filterKey, globalIndex++),
        ];
      }
    }

    return filterOptions;
  };

  return (
    <motion.div
      className="flex flex-wrap items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">{getFilterValues()}</AnimatePresence>
    </motion.div>
  );
};
export default NavigationFilter;
