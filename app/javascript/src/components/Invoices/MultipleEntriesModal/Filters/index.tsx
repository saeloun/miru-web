import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { X, MagnifyingGlass } from "phosphor-react";
import Select from "react-select";

import CustomDateRangePicker from "common/CustomDateRangePicker";

import { handleDateRangeOptions } from "./DateRange";
import SearchTeamMembers from "./SearchTeamMembers";

const Filters = ({
  teamMembers,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput,
  filterIntialValues
}) => {
  const [showCustomFilter, setShowCustomFilter] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<any>({ from: "", to: "" });
  const [customDate, setCustomDate] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(filterParams);
  const [diableDateBtn, setdisableDateBtn] = useState<boolean>(true);
  const [dateRangeOptions, setDateRangeOptions] = useState(handleDateRangeOptions());

  useEffect(() => {
    const { value, from, to } = filterParams.dateRange;
    if (value == "custom" && from && to) {
      setDateRange({ ...dateRange, from: from, to: to });
      handleCustomDate(from, to);
      setdisableDateBtn(false);
    }
  }, []);

  useEffect(() => {
    const { value, from, to } = filters.dateRange;
    if (value == "custom" && from && to){
      setCustomDate(true);
    }
    if (value == "all"){
      setDateRange({ ...dateRange, from: "", to: "" });
      setCustomDate(false);
    }
    if (dateRange.from && dateRange.to){
      setdisableDateBtn(false);
    }
  }, [filters.dateRange.value, dateRange.from, dateRange.to]);

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value === "custom"){
      setShowCustomFilter(true);
      setFilters({
        ...filters,
        [field.name]: { ...selectedValue, ...dateRange }
      });
    }
    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
    else {
      selectedValue.value != "custom" && setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
  };

  const handleSelectDate = (date) => {
    if (selectedInput === "from-input") {
      setDateRange({ ...dateRange, ...{ from: date } });
    } else {
      setDateRange({ ...dateRange, ...{ to: date } });
    }
  };

  const hideCustomFilter = () => {
    setShowCustomFilter(false);
  };

  const onClickInput = (e) => {
    setSelectedInput(e.target.name);
  };

  const handleCustomDate = (from, to) => {
    const fromDate =  dayjs(from).format("DD/MM/YY");
    const toDate =  dayjs(to).format("DD/MM/YY");
    setDateRangeOptions(handleDateRangeOptions({ value: "custom", label: `Custom ${fromDate} - ${toDate}` }));
    setCustomDate(true);
    return { fromDate: fromDate, toDate: toDate };
  };

  const submitCustomDatePicker = () => {
    if (dateRange.from && dateRange.to) {
      const { fromDate, toDate } = handleCustomDate(dateRange.from, dateRange.to);
      setFilters({ ...filters, ["dateRange"]: { value: "custom", label: `Custom ${fromDate} - ${toDate}`, ...dateRange } });
    }
    hideCustomFilter();
  };

  const defaultDateRange = () => {
    const { value } = filters.dateRange;
    if (value == "all"){
      return true;
    } else if (value == "custom" && !customDate){
      return true;
    } else {
      return false;
    }
  };

  const setDefaultDateRange = () => ({ ...filters, ["dateRange"]: { value: "all", label: "All", from: "", to: "" } });

  const resetCustomDatePicker = () => {
    defaultDateRange() && setFilters(setDefaultDateRange());
    hideCustomFilter();
  };

  const handleApply = () => {
    defaultDateRange() ? setFilterParams(setDefaultDateRange()) : setFilterParams(filters);
  };

  const handleReset = () => {
    setFilters(filterIntialValues);
    setFilterParams(filterIntialValues);
  };

  const customStyles = {
    container: base => ({
      ...base,
      width: "13rem"
    }),
    control: (provided) => ({
      ...provided,
      marginTop: "8px",
      backgroundColor: "#F5F7F9",
      color: "#1D1A31",
      minHeight: 32,
      padding: "0"
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "12px",
      letterSpacing: "2px"
    })
  };

  return (
    <div className='flex justify-between items-center px-6 py-2'>
      <div className="w-4/12 relative flex items-center">
        <input
          type="text"
          value={filters.searchTerm}
          placeholder="Search"
          className="p-2 w-full bg-miru-gray-100 text-sm font-medium
            rounded focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
        />
        {filters.searchTerm ?
          <X size={16} color="#1D1A31" className="absolute right-3"
            onClick={() => setFilters({ ...filters, searchTerm: "" })}
          />
          :
          <MagnifyingGlass size={16} color="#CDD6DF" className="absolute right-3" />
        }
      </div>
      <SearchTeamMembers
        teamMembers={teamMembers}
        filters={filters}
        setFilters={setFilters}
      />
      <div>
        <Select
          classNamePrefix="react-select-filter"
          name="dateRange"
          value={filters.dateRange}
          options={dateRangeOptions}
          onChange={handleSelectFilter}
          styles={customStyles}
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
            <div className="p-6 flex h-full items-end justify-center bg-miru-white-1000 ">
              <button onClick={resetCustomDatePicker} className="sidebar__reset">Cancel</button>
              <button
                disabled={diableDateBtn}
                className={`sidebar__apply ${(diableDateBtn) ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent" : "cursor-pointer"}`}
                onClick={submitCustomDatePicker}
              >
                Done
              </button>
            </div>
          </div>
        }
      </div>
      <button className="text-miru-han-purple-1000" onClick={handleReset}>reset</button>
      <button className="text-miru-han-purple-1000 font-semibold" onClick={handleApply}>Apply</button>
    </div>
  );
};

export default Filters;
