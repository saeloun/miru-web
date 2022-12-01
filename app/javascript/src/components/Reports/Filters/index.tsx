import React, { useEffect, useState } from "react";

import { XIcon } from "miruIcons";
import Select from "react-select";
import * as Yup from "yup";

import CustomDateRangePicker from "common/CustomDateRangePicker";
import getStatusCssClass from "utils/getBadgeStatus";

import {
  dateRangeOptions,
  statusOption,
  groupBy
} from "./filterOptions";
import { customStyles } from "./style";

import { useEntry } from "../context/EntryContext";

const dateSchema = Yup.object().shape({
  fromDate: Yup.string().required("Must include From date"),
  toDate: Yup.string().required("Must include To date")
});

const FilterSideBar = ({
  setFilterVisibilty,
  resetFilter,
  handleApplyFilter,
  onClickInput,
  selectedInput
}) => {

  const { timeEntryReport } = useEntry();
  const [filters, setFilters] = useState(timeEntryReport.selectedFilter);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    fromDateErr: "",
    toDateErr: ""
  });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    setFilters({
      ...filters,
      customDateFilter: dateRange
    });
  }, [dateRange]);

  const handleSelectDate = (date) => {
    if (selectedInput === "from-input") {
      setDateRange({ ...dateRange, ...{ from: date } });
    } else {
      setDateRange({ ...dateRange, ...{ to: date } });
    }
  };

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value === "custom"){
      setShowCustomFilter(true);
    }
    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
    else {
      setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
  };

  const submitApplyFilter = () => {
    handleApplyFilter(filters);
    setFilterVisibilty(false);
  };

  const hideCustomFilter = () => {
    setShowCustomFilter(false);
  };

  const CustomOption = (props) => {
    const { innerProps, innerRef } = props;
    return (
      <div ref={innerRef} {...innerProps} className="py-1 px-2 cursor-pointer hover:bg-miru-gray-100">
        <span className={`${getStatusCssClass(props.data.value)} text-xs tracking-widest`} >
          {props.data.label}
        </span>
      </div>
    );
  };

  const submitCustomDatePicker = () => {
    dateSchema.validate({ fromDate: dateRange.from, toDate: dateRange.to }, { abortEarly: false }).then(async () => {
      hideCustomFilter();
    }).catch(function (err) {
      const errObj = {
        fromDateErr: "",
        toDateErr: ""
      };
      err.inner.map((item) => {
        errObj[item.path + "Err"] = item.message;
      });
      setErrorMessage(errObj);
      hideCustomFilter();
    });
  };

  const resetCustomDatePicker = () => {
    hideCustomFilter();
  };

  return (
    <div className="sidebar__container flex flex-col overflow-y-auto">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
          <h4 className="text-base font-bold">
            Filters
          </h4>
          <button onClick={() => setFilterVisibilty(false)}>
            <XIcon size={12} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Date Range</h5>
              <Select
                classNamePrefix="react-select-filter"
                value={filters.dateRange}
                onChange={handleSelectFilter}
                name="dateRange"
                styles={customStyles}
                options={dateRangeOptions}
              />
              {showCustomFilter &&
                <div className="mt-1 absolute flex flex-col bg-miru-white-1000 z-20 shadow-c1 rounded-lg">
                  <CustomDateRangePicker
                    hideCustomFilter={hideCustomFilter}
                    handleSelectDate={handleSelectDate}
                    onClickInput={onClickInput}
                    selectedInput={selectedInput}
                    dateRange={dateRange}
                  />
                  <div className="flex flex-col text-center">
                    <span className="text-red-600 text-sm">{errorMessage.fromDateErr}</span>
                    <span className="text-red-600 text-sm">{errorMessage.toDateErr}</span>
                  </div>
                  <div className="p-6 flex h-full items-end justify-center bg-miru-white-1000 ">
                    <button onClick={resetCustomDatePicker} className="sidebar__reset">Cancel</button>
                    <button onClick={submitCustomDatePicker} className="sidebar__apply">Done</button>
                  </div>
                </div>
              }
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Clients</h5>
              <Select isMulti={true} value={filters.clients} classNamePrefix="react-select-filter" name="clients" onChange={handleSelectFilter} styles={customStyles} options={timeEntryReport.filterOptions.clients} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Team Members</h5>
              <Select isMulti={true} value={filters.teamMember} classNamePrefix="react-select-filter" name="teamMember" onChange={handleSelectFilter} styles={customStyles} options={timeEntryReport.filterOptions.teamMembers} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Status</h5>
              <Select isMulti={true} value={filters.status} classNamePrefix="react-select-filter" name="status" onChange={handleSelectFilter} styles={customStyles} options={statusOption} components={{ Option: CustomOption }} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Group By</h5>
              <Select
                classNamePrefix="react-select-filter"
                value={filters.groupBy}
                styles={customStyles}
                name="groupBy"
                onChange={handleSelectFilter}
                options={groupBy}
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button onClick={resetFilter} className="sidebar__reset">RESET</button>
        <button onClick={submitApplyFilter} className="sidebar__apply">APPLY</button>
      </div>
    </div>
  );
};

export default FilterSideBar;
