import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { X, Funnel, Plus, Minus } from "phosphor-react";
import { Badge, Button, SidePanel } from "StyledComponents";

import companiesApi from "apis/companies";
import CustomCheckbox from "common/CustomCheckbox";
import CustomDateRangePicker from "common/CustomDateRangePicker";
import CustomRadioButton from "common/CustomRadio";
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

  const handleSelectFilter = (selectedValue,field) => {

    if (selectedValue.value === "custom"){
      setShowCustomFilter(true);
      setFilters({
        ...filters,
        [field]: { ...selectedValue, ...dateRange }
      });
    }
    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field]: filters[field].concat(selectedValue)
      });
    }
    else {
      selectedValue.value != "custom" && setFilters({
        ...filters,
        [field]: selectedValue
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
    ["dateRange"]: [{ value: "all", label: "All", from: "", to: "" }]
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
    <SidePanel
      setFilterVisibilty={setFilterVisibilty}
      WrapperClassname = "overflow-y-auto"
    >

      <SidePanel.Header className="flex px-5 pt-5 mb-7 justify-between items-center text-miru-dark-purple-1000 font-bold">
        <h4 className="text-base flex items-center">
          <Funnel size={16} className="mr-2.5"/> Filters
        </h4>
        <Button style="ternary" onClick={() => setFilterVisibilty(false)}>
          <X size={16} className="text-miru-dark-purple-1000"/>
        </Button>
      </SidePanel.Header>

      <SidePanel.Body className="sidebar__filters" hasFooter>
        <ul>
          <li className="pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000 border-b border-miru-gray-200 cursor-pointer">
            <div
              className="px-5 flex justify-between items-center"
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            >
              <h5 className="text-xs font-bold leading-4 tracking-wider">
                DATE RANGE
              </h5>
              <div className="flex items-center">
                {
                  filters.dateRange.value != "all" && (
                    <span className="flex items-center justify-center rounded-full h-5 w-5 bg-miru-han-purple-1000 text-white text-xs font-semibold mr-7">
                      {1}
                    </span>
                  )}
                {isDateRangeOpen ? <Minus size={16} /> : <Plus size={16} />}
              </div>
            </div>
            {isDateRangeOpen && (
              <div className="md:mt-7">
                {dateRangeOptions.map((dateRange) => (
                  <CustomRadioButton
                    id={dateRange.value}
                    label={dateRange.label}
                    groupName="dateRange"
                    defaultCheck={dateRange.value == filters.dateRange.value}
                    handleOnChange={(event)=>handleSelectFilter(dateRange, event.target.name)}
                    value={dateRange.value}
                    classNameWrapper="px-5 py-2.5"
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
          <li className="pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000 border-b border-miru-gray-200 cursor-pointer">
            <div
              className="px-5 flex justify-between items-center"
              onClick={() => setIsClientOpen(!isClientOpen)}
            >
              <h5 className="text-xs font-bold leading-4 tracking-wider">
                CLIENTS
              </h5>
              <div className="flex items-center">
                {filters.clients.length > 0 && (
                  <span className="flex items-center justify-center rounded-full h-5 w-5 bg-miru-han-purple-1000 text-white text-xs font-semibold mr-7">
                    {filters.clients.length}
                  </span>
                )}
                {isClientOpen ? <Minus size={16} /> : <Plus size={16} />}
              </div>
            </div>
            {isClientOpen && (
              <div className="md:mt-7">
                {clientList.length &&
                  clientList.map((client) => (
                    <CustomCheckbox
                      id={client.value}
                      text={client.label}
                      name="clients"
                      checkboxValue={client.value}
                      isChecked={filters.clients.includes(client)}
                      handleCheck={(event)=>handleSelectFilter(client,event.target.name)}
                      wrapperClassName="py-3 px-5 hover:bg-miru-gray-100 text-miru-dark-purple-1000"
                      labelClassName="ml-4"
                    />
                  ))}
              </div>
            )}
          </li>
          <li className="pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000 border-b border-miru-gray-200 cursor-pointer">
            <div
              className="px-5 flex justify-between items-center"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
            >
              <h5 className="text-xs font-bold leading-4 tracking-wider">
                STATUS
              </h5>
              <div className="flex items-center">
                {filters.status.length > 0 && (
                  <span className="flex items-center justify-center rounded-full h-5 w-5 bg-miru-han-purple-1000 text-white text-xs font-semibold mr-7">
                    {filters.status.length}
                  </span>
                )}
                {isStatusOpen ? <Minus size={16} /> : <Plus size={16} />}
              </div>
            </div>
            {isStatusOpen && (
              <div className="md:mt-7">
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
                      handleCheck={(event)=>handleSelectFilter(status,event.target.name)}
                      wrapperClassName="py-3 px-5 hover:bg-miru-gray-100"
                      labelClassName="ml-4"
                    />
                  ))}
              </div>
            )}
          </li>
        </ul>
      </SidePanel.Body>
      <SidePanel.Footer className="sidebar__footer">
        <Button onClick={handleReset} style="secondary" size="medium" className="mr-4 flex justify-between items-center">
            RESET
        </Button>
        <Button onClick={handleApply} style="primary" size="medium">APPLY</Button>
      </SidePanel.Footer>
    </SidePanel>
  );
};

export default FilterSideBar;
