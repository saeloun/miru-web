import React, { useEffect, useState } from "react";

import CustomDateRangePicker from "common/CustomDateRangePicker";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { XIcon, SearchIcon } from "miruIcons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

import { handleDateRangeOptions } from "./DateRange";
import SearchTeamMembers from "./SearchTeamMembers";

const Filters = ({
  teamMembers,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput,
  filterIntialValues,
  handleSelectAll,
}) => {
  const [showCustomFilter, setShowCustomFilter] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<any>({ from: "", to: "" });
  const [customDate, setCustomDate] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(filterParams);
  const [disableDateBtn, setDisableDateBtn] = useState<boolean>(true);
  const [dateRangeOptions, setDateRangeOptions] = useState(
    handleDateRangeOptions()
  );
  const { isDesktop } = useUserContext();
  const isResetActive =
    filters.teamMembers.length > 0 ||
    filters.dateRange.label !== "All" ||
    filters.searchTerm !== "";

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
      if (selectedValue.value !== "custom") {
        setFilters({
          ...filters,
          [field.name]: selectedValue,
        });
      }
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
    if (defaultDateRange()) {
      setFilters(setDefaultDateRange());
    }
    hideCustomFilter();
  };

  const handleApply = () => {
    defaultDateRange()
      ? setFilterParams(setDefaultDateRange())
      : setFilterParams(filters);
  };

  const handleReset = e => {
    setFilters(filterIntialValues);
    setFilterParams(filterIntialValues);
    handleSelectAll(e);
  };

  const customStyles = {
    container: base => ({
      ...base,
      width: isDesktop ? "13rem" : "auto",
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
    <div className="flex flex-col items-center justify-between px-2 pt-2 pb-4 lg:flex-row lg:px-6">
      <div className="relative flex w-full items-center lg:w-4/12 lg:py-0">
        <input
          placeholder="Search"
          type="text"
          value={filters.searchTerm}
          className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
        />
        {filters.searchTerm ? (
          <XIcon
            className="absolute right-3"
            color="#1D1A31"
            size={16}
            onClick={() => setFilters({ ...filters, searchTerm: "" })}
          />
        ) : (
          <SearchIcon className="absolute right-3" color="#CDD6DF" size={16} />
        )}
      </div>
      <div className="flex w-full items-center justify-between py-4 lg:w-6/12 lg:justify-evenly">
        <SearchTeamMembers
          filters={filters}
          setFilters={setFilters}
          teamMembers={teamMembers}
        />
        <div className="ml-2 w-1/2 lg:w-auto">
          <Select
            name="dateRange"
            value={filters.dateRange?.value || ""}
            onValueChange={value => {
              const selectedOption = dateRangeOptions.find(
                option => option.value === value
              );
              handleSelectFilter(selectedOption, { name: "dateRange" });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>
      <div className="flex w-full items-center justify-between px-2 lg:w-2/12 lg:py-0">
        <button
          disabled={!isResetActive}
          className={`text-base lg:hover:text-miru-han-purple-1000 ${
            isResetActive
              ? "text-miru-han-purple-1000"
              : "text-miru-han-purple-100"
          }`}
          onClick={handleReset}
        >
          RESET
        </button>
        <button
          disabled={!isResetActive}
          className={`text-base lg:hover:text-miru-han-purple-1000 ${
            isResetActive
              ? "text-miru-han-purple-1000"
              : "text-miru-han-purple-100"
          }`}
          onClick={handleApply}
        >
          APPLY
        </button>
      </div>
    </div>
  );
};

export default Filters;
