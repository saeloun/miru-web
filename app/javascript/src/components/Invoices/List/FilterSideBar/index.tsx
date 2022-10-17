import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { X, Funnel, Plus, Minus } from "phosphor-react";
import { Badge } from "StyledComponents";

import companiesApi from "apis/companies";
import CustomCheckbox from "common/CustomCheckbox";
import CustomDateRangePicker from "common/CustomDateRangePicker";
import CustomRadioButton from "common/CustomRadio";
import getStatusCssClass from "utils/getStatusTag";

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
  const [isDateRangeOpen, setIsDateRangeOpen] = useState<boolean>(false);
  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);

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
    if (value == "custom" && from && to) {
      setCustomDate(true);
    }
    if (value == "all") {
      setDateRange({ ...dateRange, from: "", to: "" });
      setCustomDate(false);
    }
    if (dateRange.from && dateRange.to) {
      setdisableDateBtn(false);
    }
  }, [filters.dateRange.value, dateRange.from, dateRange.to]);

  const sortClients = (a, b) => {
    if (a.label.toLowerCase() < b.label.toLowerCase()) {
      return -1;
    }
    if (a.label.toLowerCase() > b.label.toLowerCase()) {
      return 1;
    }
    return 0;
  };

  const fetchCompanyDetails = async () => {
    try {
      const res = await companiesApi.index();
      const clientArr = res.data.company_client_list.map((item) => ({
        label: item.name,
        value: item.id
      }));
      setClientList(clientArr.sort(sortClients));
      setLoading(false);
    } catch (e) {
      handleReset();
    }
  };

  const handleSelectFilter = (event) => {
    const selectedValue = dateRangeOptions.filter(
      (option) => option.label === event.target.value
    );

    if (selectedValue[0].value === "custom") {
      setShowCustomFilter(true);
      setFilters({
        ...filters,
        [event.target.name]: { ...selectedValue, ...dateRange }
      });
    }
    else {
      selectedValue[0].value != "custom" &&
        setFilters({
          ...filters,
          [event.target.name]: selectedValue
        });
    }
  };

  const handleCheck = (event) => {
    switch (event.target.name) {
      case "clients": {
        const selectedValue = clientList.filter(
          (option) => option.value == event.target.value
        );

        if (event.target.checked) {
          if (!filters.clients.includes(selectedValue)) {
            setFilters({
              ...filters,
              [event.target.name]: filters.clients.concat(selectedValue)
            });
          }
        } else {
          const newarr = filters.clients.filter(
            (client) => client != selectedValue[0]
          );
          setFilters({
            ...filters,
            [event.target.name]: newarr
          });
        }
        break;
      }

      case "status": {
        const selectedValue2 = statusOptions.filter(
          (option) => option.value == event.target.value
        );

        if (event.target.checked) {
          if (!filters.status.includes(selectedValue2)) {

            setFilters({
              ...filters,
              [event.target.name]: filters.status.concat(selectedValue2)
            });
          }
        } else {
          const newarr = filters.status.filter(
            (status) => status != selectedValue2[0]
          );
          setFilters({
            ...filters,
            [event.target.name]: newarr
          });
        }
        break;
      }
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
      const fromDate = dayjs(dateRange.from).format("DD/MM/YY");
      const toDate = dayjs(dateRange.to).format("DD/MM/YY");

      setFilters({
        ...filters,
        ["dateRange"]: {
          value: "custom",
          label: `Custom ${fromDate} - ${toDate}`,
          ...dateRange
        }
      });
      setCustomDate(true);
    }
    hideCustomFilter();
  };

  const defaultDateRange = () => {
    const { value } = filters.dateRange;
    if (value == "all") {
      return true;
    } else if (value == "custom" && !customDate) {
      return true;
    } else {
      return false;
    }
  };

  const setDefaultDateRange = () => ({
    ...filters,
    ["dateRange"]: { value: "all", label: "All", from: "", to: "" }
  });

  const resetCustomDatePicker = () => {
    defaultDateRange() && setFilters(setDefaultDateRange());
    hideCustomFilter();
  };

  const handleReset = () => {
    setFilterParams(filterIntialValues);
    setFilterVisibilty(false);
  };

  const handleApply = () => {
    defaultDateRange()
      ? setFilterParams(setDefaultDateRange())
      : setFilterParams(filters);
    setFilterVisibilty(false);
  };

  if (loading) {
    return <div>Loading....</div>;
  }

  return (
    <div className="sidebar__container flex flex-col">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
          <h4 className="text-base text-miru-dark-purple-1000 font-bold flex items-center">
            <Funnel size={16} className="mr-2.5" />
            Filters
          </h4>
          <button
            className="text-miru-dark-purple-1000 font-bold"
            onClick={() => setFilterVisibilty(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000 border-b border-miru-gray-200 cursor-pointer">
              <div
                className="flex justify-between items-center"
                onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              >
                <h5 className="text-xs font-bold leading-4 tracking-wider">
                  DATE RANGE
                </h5>
                {isDateRangeOpen ? <Minus size={16} /> : <Plus size={16} />}
              </div>
              {isDateRangeOpen && (
                <div className="mt-7">
                  {dateRangeOptions.map((dateRange) => (
                    <CustomRadioButton
                      id={dateRange.value}
                      label={dateRange.label}
                      groupName="dateRange"
                      defaultCheck={dateRange.value === "all"}
                      handleOnChange={handleSelectFilter}
                    />
                  ))}
                </div>
              )}
              {showCustomFilter && (
                <div className="mt-1 absolute flex flex-col bg-miru-white-1000 z-20 shadow-c1 rounded-lg">
                  <CustomDateRangePicker
                    hideCustomFilter={hideCustomFilter}
                    handleSelectDate={handleSelectDate}
                    onClickInput={onClickInput}
                    selectedInput={selectedInput}
                    dateRange={dateRange}
                  />
                  <div className="p-6 flex h-full items-end justify-center bg-miru-white-1000 ">
                    <button
                      onClick={resetCustomDatePicker}
                      className="sidebar__reset"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={diableDateBtn}
                      className={`sidebar__apply ${
                        diableDateBtn
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
            </li>
            <li className="px-5 pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000 border-b border-miru-gray-200 cursor-pointer">
              <div
                className="flex justify-between items-center"
                onClick={() => setIsClientOpen(!isClientOpen)}
              >
                <h5 className="text-xs font-bold leading-4 tracking-wider">
                  CLIENTS
                </h5>
                {isClientOpen ? <Minus size={16} /> : <Plus size={16} />}
              </div>
              {isClientOpen && (
                <div className="mt-7">
                  {clientList.length &&
                    clientList.map((client) => (
                      <CustomCheckbox
                        id={client.value}
                        text={client.label}
                        name="clients"
                        checkboxValue={client.value}
                        isChecked={filters.clients.includes(client)}
                        handleCheck={handleCheck}
                      />
                    ))}
                </div>
              )}

            </li>
            <li className="px-5 pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000 border-b border-miru-gray-200 cursor-pointer">
              <div
                className="flex justify-between items-center"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
              >
                <h5 className="text-xs font-bold leading-4 tracking-wider">
                  STATUS
                </h5>
                {isStatusOpen ? <Minus size={16} /> : <Plus size={16} />}
              </div>
              {isStatusOpen && (
                <div className="mt-7">
                  {statusOptions.length &&
                    statusOptions.map((status) => (
                      <CustomCheckbox
                        id={status.value}
                        text={
                          <Badge
                            text={status.label}
                            className={getStatusCssClass(status.label)}
                          />
                        }
                        name="status"
                        checkboxValue={status.value}
                        isChecked={filters.status.includes(status)}
                        handleCheck={handleCheck}
                      />
                    ))}
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button className="sidebar__reset" onClick={handleReset}>
          RESET
        </button>
        <button className="sidebar__apply" onClick={handleApply}>
          APPLY
        </button>
      </div>
    </div>
  );
};

export default FilterSideBar;
