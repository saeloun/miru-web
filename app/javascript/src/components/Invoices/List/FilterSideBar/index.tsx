import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useDebounce } from "helpers";
import { XIcon, FilterIcon, PlusIcon, MinusIcon, SearchIcon } from "miruIcons";
import { Badge, Button, SidePanel } from "StyledComponents";

import companiesApi from "apis/companies";
import CustomCheckbox from "common/CustomCheckbox";
import CustomDateRangePicker from "common/CustomDateRangePicker";
import CustomRadioButton from "common/CustomRadio";
import getStatusCssClass from "utils/getBadgeStatus";

import { dateRangeOptions, statusOptions } from "./filterOptions";

dayjs.extend(advancedFormat);

const FilterSideBar = ({
  filterIntialValues,
  setIsFilterVisible,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [clientList, setClientList] = useState<null | any[]>([]);
  const [filteredClientList, setFilteredClientList] = useState<null | any[]>(
    clientList
  );
  const [showCustomFilter, setShowCustomFilter] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<any>({ from: "", to: "" });
  const [customDate, setCustomDate] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(filterParams);
  const [disableDateBtn, setDisableDateBtn] = useState<boolean>(true);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState<boolean>(false);
  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRangeList, setDateRangeList] = useState<any>(dateRangeOptions);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const { value, from, to } = filterParams.dateRange;
    if (value == "custom" && from && to) {
      setDateRange({ ...dateRange, from, to });
      setCustomDate(true);
      setDateRangeList(dateRangeOptions);
      setDisableDateBtn(false);
    } else {
      dateRangeOptions[5].label = "Custom";
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
      setDisableDateBtn(false);
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
      const clientArr = res.data.company_client_list.map(item => ({
        label: item.name,
        value: item.id,
      }));
      setClientList(clientArr.sort(sortClients));
      setFilteredClientList(clientArr.sort(sortClients));
      setLoading(false);
    } catch {
      handleReset();
    }
  };

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value !== "custom") {
      dateRangeOptions[5].label = "Custom";
      setDefaultDateRange();
    }

    if (selectedValue.value === "custom") {
      setShowCustomFilter(true);
      setFilters({
        ...filters,
        [field.name]: { ...selectedValue, ...dateRange },
      });
    }

    if (field.name == "dateRange") {
      setFilters({
        ...filters,
        [field.name]: selectedValue,
      });
    }

    if (field.name != "dateRange") {
      if (field.checked) {
        setFilters({
          ...filters,
          [field.name]: filters[field.name].concat(selectedValue),
        });
      } else {
        const newarr = filters[field.name].filter(
          client => client.value != selectedValue.value
        );

        setFilters({
          ...filters,
          [field.name]: newarr,
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

  const submitCustomDatePicker = () => {
    if (dateRange.from && dateRange.to) {
      const fromDate = dayjs(dateRange.from).format("Do MMM");
      const toDate = dayjs(dateRange.to).format("Do MMM");
      dateRangeOptions[5].label = `Custom (${fromDate} - ${toDate})`;

      setFilters({
        ...filters,
        ["dateRange"]: {
          value: "custom",
          label: `Custom (${fromDate} - ${toDate})`,
          ...dateRange,
        },
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

  const handleReset = () => {
    setFilterParams(filterIntialValues);
    setIsFilterVisible(false);
  };

  const handleApply = () => {
    defaultDateRange()
      ? setFilterParams(setDefaultDateRange())
      : setFilterParams(filters);
    setIsFilterVisible(false);
  };

  useEffect(() => {
    if (debouncedSearchQuery && filteredClientList.length > 0) {
      const newClientList = filteredClientList.filter(client =>
        client.label.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

      newClientList.length > 0
        ? setFilteredClientList(newClientList)
        : setFilteredClientList([]);
    } else {
      setFilteredClientList(clientList);
    }
  }, [debouncedSearchQuery]);

  if (loading) {
    return <div>Loading....</div>;
  }

  return (
    <SidePanel setFilterVisibilty={setIsFilterVisible}>
      <SidePanel.Header className="mb-2 flex items-center justify-between bg-miru-han-purple-1000 px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-miru-dark-purple-1000">
        <h4 className="flex items-center text-base">
          <FilterIcon className="mr-2.5" size={16} /> Filters
        </h4>
        <Button style="ternary" onClick={() => setIsFilterVisible(false)}>
          <XIcon
            className="text-white lg:text-miru-dark-purple-1000"
            size={16}
          />
        </Button>
      </SidePanel.Header>
      <SidePanel.Body hasFooter className="sidebar__filters">
        <ul>
          <li className="cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000">
            <div
              className="flex items-center justify-between px-5"
              onClick={() => {
                setIsStatusOpen(false);
                setIsClientOpen(false);
                setIsDateRangeOpen(!isDateRangeOpen);
              }}
            >
              <h5 className="text-xs font-bold leading-4 tracking-wider">
                DATE RANGE
              </h5>
              <div className="flex items-center">
                {filters.dateRange.value != "all" && (
                  <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                    {1}
                  </span>
                )}
                {isDateRangeOpen ? (
                  <MinusIcon size={16} />
                ) : (
                  <PlusIcon size={16} />
                )}
              </div>
            </div>
            {isDateRangeOpen && (
              <div className="lg:mt-7">
                {dateRangeList.map(dateRange => (
                  <CustomRadioButton
                    classNameWrapper="px-5 py-2.5"
                    defaultCheck={dateRange.value == filters.dateRange.value}
                    groupName="dateRange"
                    id={dateRange.value}
                    key={dateRange.value}
                    label={dateRange.label}
                    value={dateRange.value}
                    handleOnChange={event =>
                      handleSelectFilter(dateRange, event.target)
                    }
                  />
                ))}
              </div>
            )}
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
          </li>
          <li className="cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000">
            <div
              className="flex items-center justify-between px-5 hover:text-miru-han-purple-1000"
              onClick={() => {
                setIsStatusOpen(false);
                setIsDateRangeOpen(false);
                setIsClientOpen(!isClientOpen);
              }}
            >
              <h5 className="text-xs font-bold leading-4 tracking-wider">
                CLIENTS
              </h5>
              <div className="flex items-center">
                {filters.clients.length > 0 && (
                  <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                    {filters.clients.length}
                  </span>
                )}
                {isClientOpen ? (
                  <MinusIcon size={16} />
                ) : (
                  <PlusIcon size={16} />
                )}
              </div>
            </div>
            {isClientOpen && (
              <div className="lg:mt-7">
                <div className="relative mt-2 flex w-full items-center px-5">
                  <input
                    placeholder="Search"
                    type="text"
                    value={searchQuery}
                    className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                    onChange={e => {
                      setSearchQuery(e.target.value);
                    }}
                  />
                  {searchQuery ? (
                    <XIcon
                      className="absolute right-8"
                      color="#1D1A31"
                      size={16}
                      onClick={() => setSearchQuery("")}
                    />
                  ) : (
                    <SearchIcon
                      className="absolute right-8"
                      color="#1D1A31"
                      size={16}
                    />
                  )}
                </div>
                <div className="h-96 overflow-y-auto lg:mt-7">
                  {filteredClientList.length > 0 ? (
                    filteredClientList.map(client => (
                      <CustomCheckbox
                        checkboxValue={client.value}
                        id={client.value}
                        key={client.value}
                        labelClassName="ml-4"
                        name="clients"
                        text={client.label}
                        wrapperClassName="py-3 px-5 hover:bg-miru-gray-100 text-miru-dark-purple-1000"
                        handleCheck={event =>
                          handleSelectFilter(client, event.target)
                        }
                        isChecked={filters.clients.some(
                          e => e.value === client.value
                        )}
                      />
                    ))
                  ) : (
                    <div className="m-5">No results found</div>
                  )}
                </div>
              </div>
            )}
          </li>
          <li className="cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000">
            <div
              className="flex items-center justify-between px-5 hover:text-miru-han-purple-1000"
              onClick={() => {
                setIsDateRangeOpen(false);
                setIsClientOpen(false);
                setIsStatusOpen(!isStatusOpen);
              }}
            >
              <h5 className="text-xs font-bold leading-4 tracking-wider">
                STATUS
              </h5>
              <div className="flex items-center">
                {filters.status.length > 0 && (
                  <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                    {filters.status.length}
                  </span>
                )}
                {isStatusOpen ? (
                  <MinusIcon size={16} />
                ) : (
                  <PlusIcon size={16} />
                )}
              </div>
            </div>
            {isStatusOpen && (
              <div className="lg:mt-7">
                {statusOptions.length &&
                  statusOptions.map(status => (
                    <CustomCheckbox
                      checkboxValue={status.value}
                      id={status.value}
                      key={status.value}
                      labelClassName="ml-4"
                      name="status"
                      wrapperClassName="py-3 px-5 hover:bg-miru-gray-100"
                      handleCheck={event =>
                        handleSelectFilter(status, event.target)
                      }
                      isChecked={filters.status.some(
                        e => e.value === status.value
                      )}
                      text={
                        <Badge
                          className={getStatusCssClass(status.label)}
                          text={status.label}
                        />
                      }
                    />
                  ))}
              </div>
            )}
          </li>
        </ul>
      </SidePanel.Body>
      <SidePanel.Footer className="sidebar__footer justify-between">
        <Button
          className="mr-4 flex items-center justify-between"
          size="medium"
          style="secondary"
          onClick={handleReset}
        >
          RESET
        </Button>
        <Button size="medium" style="primary" onClick={handleApply}>
          APPLY
        </Button>
      </SidePanel.Footer>
    </SidePanel>
  );
};

export default FilterSideBar;
