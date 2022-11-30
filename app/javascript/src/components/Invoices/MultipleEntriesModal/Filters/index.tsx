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
  filterIntialValues,
}) => {
  const [showCustomFilter, setShowCustomFilter] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<any>({ from: "", to: "" });
  const [customDate, setCustomDate] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(filterParams);
  const [disableDateBtn, setDisableDateBtn] = useState<boolean>(true);
  const [dateRangeOptions, setDateRangeOptions] = useState(
    handleDateRangeOptions()
  );

  useEffect(() => {
    const { value, from, to } = filterParams.dateRange;
    if (value == "custom" && from && to) {
      setDateRange({ ...dateRange, from, to });
      handleCustomDate(from, to);
      setDisableDateBtn(false);
    }
  }, []);

  useEffect(() => {
    const { value, from, to } = filters.dateRange;
    if (value == "custom" && from && to) {
      setCustomDate(true);
    }

    if (value == "all") {
      setDateRange({ ...dateRange, from: "", to: "" });
      setCustomDate(false);
    }

    if (dateRange.from && dateRange.to) {
      setDisableDateBtn(false);
    }
  }, [filters.dateRange.value, dateRange.from, dateRange.to]);

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value === "custom") {
      setShowCustomFilter(true);
      setFilters({
        ...filters,
        [field.name]: { ...selectedValue, ...dateRange },
      });
    }

    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field.name]: selectedValue,
      });
    } else {
      selectedValue.value != "custom" &&
        setFilters({
          ...filters,
          [field.name]: selectedValue,
        });
    }
  };

  const handleSelectDate = date => {
    if (selectedInput === "from-input") {
      setDateRange({ ...dateRange, ...{ from: date } });
    } else {
      setDateRange({ ...dateRange, ...{ to: date } });
    }
  };

  const hideCustomFilter = () => {
    setShowCustomFilter(false);
  };

  const onClickInput = e => {
    setSelectedInput(e.target.name);
  };

  const handleCustomDate = (from, to) => {
    const fromDate = dayjs(from).format("DD/MM/YY");
    const toDate = dayjs(to).format("DD/MM/YY");
    setDateRangeOptions(
      handleDateRangeOptions({
        value: "custom",
        label: `Custom ${fromDate} - ${toDate}`,
      })
    );
    setCustomDate(true);

    return { fromDate, toDate };
  };

  const submitCustomDatePicker = () => {
    if (dateRange.from && dateRange.to) {
      const { fromDate, toDate } = handleCustomDate(
        dateRange.from,
        dateRange.to
      );

      setFilters({
        ...filters,
        ["dateRange"]: {
          value: "custom",
          label: `Custom ${fromDate} - ${toDate}`,
          ...dateRange,
        },
      });
    }
    hideCustomFilter();
  };

  const defaultDateRange = () => {
    const { value } = filters.dateRange;
    if (value == "all") {
      return true;
    } else if (value == "custom" && !customDate) {
      return true;
    }

    return false;
  };

  const setDefaultDateRange = () => ({
    ...filters,
    ["dateRange"]: { value: "all", label: "All", from: "", to: "" },
  });

  const resetCustomDatePicker = () => {
    defaultDateRange() && setFilters(setDefaultDateRange());
    hideCustomFilter();
  };

  const handleApply = () => {
    defaultDateRange()
      ? setFilterParams(setDefaultDateRange())
      : setFilterParams(filters);
  };

  const handleReset = () => {
    setFilters(filterIntialValues);
    setFilterParams(filterIntialValues);
  };

  const customStyles = {
    container: base => ({
      ...base,
      width: "13rem",
    }),
    control: provided => ({
      ...provided,
      color: "#1D1A31",
      padding: "0",
    }),
    menu: provided => ({
      ...provided,
      fontSize: "12px",
      letterSpacing: "2px",
    }),
    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected && "#5B34EA",
      "&:hover": {
        backgroundColor: isSelected ? "#5B34EA" : "#F5F7F9",
      },
    }),
  };

  return (
    <div className="flex items-center justify-between px-6 py-2">
      <div className="relative flex w-4/12 items-center">
        <input
          placeholder="Search"
          type="text"
          value={filters.searchTerm}
          className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
        />
        {filters.searchTerm ? (
          <X
            className="absolute right-3"
            color="#1D1A31"
            size={16}
            onClick={() => setFilters({ ...filters, searchTerm: "" })}
          />
        ) : (
          <MagnifyingGlass
            className="absolute right-3"
            color="#CDD6DF"
            size={16}
          />
        )}
      </div>
      <SearchTeamMembers
        filters={filters}
        setFilters={setFilters}
        teamMembers={teamMembers}
      />
      <div>
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
            <div className="flex h-full items-end justify-center bg-miru-white-1000 p-6 ">
              <button
                className="sidebar__reset"
                onClick={resetCustomDatePicker}
              >
                Cancel
              </button>
              <button
                disabled={disableDateBtn}
                className={`sidebar__apply ${
                  disableDateBtn
                    ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                    : "cursor-pointer"
                }`}
                onClick={submitCustomDatePicker}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        className="text-base text-miru-han-purple-100 hover:text-miru-han-purple-1000"
        onClick={handleReset}
      >
        RESET
      </button>
      <button
        className="text-base text-miru-han-purple-1000"
        onClick={handleApply}
      >
        APPLY
      </button>
    </div>
  );
};

export default Filters;
