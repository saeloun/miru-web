import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { X } from "phosphor-react";
import Select from "react-select";

import companiesApi from "apis/companies";
import CustomDateRangePicker from "common/CustomDateRangePicker";
import getStatusCssClass from "utils/getBadgeStatus";

import { dateRangeOptions, statusOptions } from "./filterOptions";

const FilterSideBar = ({
  filterIntialValues,
  setFilterVisibilty,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [clientList, setClientList] = useState<null | any[]>([]);
  const [showCustomFilter, setShowCustomFilter] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<any>({ from: "", to: "" });
  const [customDate, setCustomDate] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(filterParams);
  const [diableDateBtn, setdisableDateBtn] = useState<boolean>(true);

  useEffect(() => {
    const { value, from, to } = filterParams.dateRange;
    if (value == "custom" && from && to) {
      setDateRange({ ...dateRange, from: from, to: to });
      setCustomDate(true);
      setdisableDateBtn(false);
    }
    fetchCompanyDetails();
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

  const sortClients = ( a, b ) => {
    if ( a.label.toLowerCase() < b.label.toLowerCase() ){
      return -1;
    }
    if ( a.label.toLowerCase() > b.label.toLowerCase() ){
      return 1;
    }
    return 0;
  };

  const fetchCompanyDetails = async () => {
    try {
      const res = await companiesApi.index();
      const clientArr = res.data.company_client_list.map((item) => ({ label: item.name, value: item.id }));
      setClientList(clientArr.sort(sortClients));
      setLoading(false);
    } catch (e) {
      handleReset();
    }
  };

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

  const submitCustomDatePicker = () => {
    if (dateRange.from && dateRange.to) {
      const fromDate =  dayjs(dateRange.from).format("DD/MM/YY");
      const toDate =  dayjs(dateRange.to).format("DD/MM/YY");

      setFilters({ ...filters, ["dateRange"]: { value: "custom", label: `Custom ${fromDate} - ${toDate}`, ...dateRange } });
      setCustomDate(true);
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

  const handleReset = () => {
    setFilterParams(filterIntialValues);
    setFilterVisibilty(false);
  };

  const handleApply = () => {
    defaultDateRange() ? setFilterParams(setDefaultDateRange()) : setFilterParams(filters);
    setFilterVisibilty(false);
  };

  const customStyles = {
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

  const CustomOption = (props) => {
    const { innerProps, innerRef } = props;

    return (
      <div ref={innerRef} {...innerProps} className="py-1 px-2 cursor-pointer hover:bg-miru-gray-100">
        <span className={`${getStatusCssClass(props.data.label)} text-xs tracking-widest`} >
          {props.data.label}
        </span>
      </div>
    );
  };

  if (loading){
    return <div>Loading....</div>;
  }

  return (
    <div className="sidebar__container flex flex-col">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
          <h4 className="text-base font-bold">
            Filter
          </h4>
          <button onClick = {() => setFilterVisibilty(false)}>
            <X size={12} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">DATE RANGE</h5>
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
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">CLIENTS</h5>
              <Select
                isMulti={true}
                placeholder="All"
                classNamePrefix="react-select-filter"
                name="clients"
                value={filters.clients}
                options={clientList}
                onChange={handleSelectFilter}
                styles={customStyles}
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">STATUS</h5>
              <Select
                isMulti={true}
                placeholder="All"
                classNamePrefix="react-select-filter"
                name="status"
                value={filters.status}
                options={statusOptions}
                onChange={handleSelectFilter}
                styles={customStyles}
                components={{ Option: CustomOption }}

              />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button className="sidebar__reset" onClick={handleReset}>RESET</button>
        <button className="sidebar__apply" onClick={handleApply}>APPLY</button>
      </div>
    </div>
  );
};

export default FilterSideBar;
