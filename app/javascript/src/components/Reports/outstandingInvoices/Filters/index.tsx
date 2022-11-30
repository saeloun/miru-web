import React, { useState } from "react";

import { XIcon } from "miruIcons";
import Select from "react-select";
import * as Yup from "yup";

import CustomDateRangePicker from "common/CustomDateRangePicker";

import { dateRangeOptions } from "./filterOptions";
import { customStyles } from "./style";

import { useEntry } from "../../context/EntryContext";

const dateSchema = Yup.object().shape({
  fromDate: Yup.string().required("Must include From date"),
  toDate: Yup.string().required("Must include To date"),
});

const FilterSideBar = ({
  setIsFilterVisible,
  resetFilter,
  handleApplyFilter,
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange,
}) => {
  const { revenueByClientReport } = useEntry();
  const [filters, setFilters] = useState(revenueByClientReport.selectedFilter);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    fromDateErr: "",
    toDateErr: "",
  });

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value === "custom") {
      setShowCustomFilter(true);
    }

    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field.name]: selectedValue,
      });
    } else {
      setFilters({
        ...filters,
        [field.name]: selectedValue,
      });
    }
  };

  const submitApplyFilter = () => {
    handleApplyFilter(filters);
  };

  const hideCustomFilter = () => {
    setShowCustomFilter(false);
  };

  const submitCustomDatePicker = async () => {
    try {
      await dateSchema.validate(
        { fromDate: dateRange.from, toDate: dateRange.to },
        { abortEarly: false }
      );
      await hideCustomFilter();
    } catch (err) {
      const errObj = {
        fromDateErr: "",
        toDateErr: "",
      };

      err.inner.map(item => {
        errObj[`${item.path}Err`] = item.message;
      });
      setErrorMessage(errObj);
      hideCustomFilter();
    }
  };

  const resetCustomDatePicker = () => {
    hideCustomFilter();
  };

  return (
    <div className="sidebar__container flex min-w-max flex-col	">
      <div>
        <div className="mb-7 flex items-center justify-between px-5 pt-5">
          <h4 className="text-base font-bold">Filters</h4>
          <button onClick={() => setIsFilterVisible(false)}>
            <XIcon size={12} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Date Range</h5>
              <Select
                classNamePrefix="react-select-filter"
                name="dateRange"
                options={dateRangeOptions}
                styles={customStyles}
                value={filters.dateRange}
                onChange={handleSelectFilter}
              />
              {showCustomFilter && (
                <div className="absolute z-20 mt-1 flex flex-col rounded-lg bg-miru-white-1000 shadow-c1">
                  <CustomDateRangePicker
                    dateRange={dateRange}
                    handleSelectDate={handleSelectDate}
                    hideCustomFilter={hideCustomFilter}
                    selectedInput={selectedInput}
                    onClickInput={onClickInput}
                  />
                  <div className="flex flex-col text-center">
                    <span className="text-sm text-red-600">
                      {errorMessage.fromDateErr}
                    </span>
                    <span className="text-sm text-red-600">
                      {errorMessage.toDateErr}
                    </span>
                  </div>
                  <div className="flex h-full items-end justify-center bg-miru-white-1000 p-6 ">
                    <button
                      className="sidebar__reset"
                      onClick={resetCustomDatePicker}
                    >
                      Cancel
                    </button>
                    <button
                      className="sidebar__apply"
                      onClick={submitCustomDatePicker}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Clients</h5>
              <Select
                isMulti
                classNamePrefix="react-select-filter"
                name="clients"
                options={revenueByClientReport.filterOptions.clients}
                styles={customStyles}
                value={filters.clients}
                onChange={handleSelectFilter}
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button className="sidebar__reset" onClick={resetFilter}>
          RESET
        </button>
        <button className="sidebar__apply" onClick={submitApplyFilter}>
          APPLY
        </button>
      </div>
    </div>
  );
};

export default FilterSideBar;
