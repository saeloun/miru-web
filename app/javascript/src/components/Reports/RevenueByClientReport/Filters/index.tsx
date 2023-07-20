import React, { useEffect, useRef, useState } from "react";

import dayjs from "dayjs";
import { useDebounce, useOutsideClick } from "helpers";
import Logger from "js-logger";
import { FilterIcon, MinusIcon, PlusIcon, XIcon } from "miruIcons";
import { Button, SidePanel } from "StyledComponents";

import companiesApi from "apis/companies";
import clientRevenueApi from "apis/reports/clientRevenue";
import CustomDateRangePicker from "common/CustomDateRangePicker";
import CustomRadioButton from "common/CustomRadio";
import ClientFilter from "components/Reports/Filters/ClientFilter";
import { LocalStorageKeys } from "constants/index";
import { useUserContext } from "context/UserContext";

import { dateRangeOptions } from "./filterOptions";

const FilterSideBar = ({
  dateRange,
  setDateRange,
  setIsFilterVisible,
  resetFilter,
  setFilterParams,
  setSelectedInput,
  selectedInput,
  filterParams,
  setSelectedFilter,
  setFilterCounter,
}) => {
  const [clientList, setClientList] = useState<null | any[]>([]);
  const [filters, setFilters] = useState(filterParams);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [filteredClientList, setFilteredClientList] = useState<null | any[]>(
    clientList
  );
  const [customDate, setCustomDate] = useState<boolean>(false);
  const [disableDateBtn, setDisableDateBtn] = useState<boolean>(true);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState<boolean>(false);
  const [dateRangeList, setDateRangeList] = useState<any>(dateRangeOptions);
  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [disableApplyBtn, setDisableApplyBtn] = useState(false);

  const { isDesktop } = useUserContext();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, () => setShowCustomFilter(false), selectedInput);

  useEffect(() => {
    const { value, from, to } = filterParams.dateRange;
    if (value == "custom" && from && to) {
      setDateRange({ ...dateRange, from, to });
      setCustomDate(true);
      setDateRangeList(dateRangeOptions);
      setDisableDateBtn(false);
    } else {
      dateRangeOptions[4].label = "Custom";
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
    } catch {
      resetFilter();
    }
  };

  useEffect(() => {
    fetchAndSetClients();
  }, []);

  const fetchAndSetClients = async () => {
    try {
      const { data } = await clientRevenueApi.newReport();
      setClientList(
        data.client_details.map(client => ({
          value: client.id,
          label: client.name,
        }))
      );
    } catch {
      Logger.error("Error fetching clients");
    }
  };

  const handleSelectFilter = (selectedValue, field) => {
    if (selectedValue.value !== "custom") {
      dateRangeOptions[4].label = "Custom";
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
        if (filters[field.name][0].label === "All Clients") {
          filters[field.name].splice(0, 1);
        }

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

  const submitCustomDatePicker = async () => {
    if (dateRange.from && dateRange.to) {
      const fromDate = dayjs(dateRange.from).format("Do MMM");
      const toDate = dayjs(dateRange.to).format("Do MMM");
      dateRangeOptions[4].label = `Custom (${fromDate} - ${toDate})`;

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
    setSelectedInput("from-input");
  };

  const defaultDateRange = () => {
    const { value } = filters.dateRange;
    if (value == "all_time") {
      return true;
    } else if (value == "custom" && !customDate) {
      return true;
    }

    return false;
  };

  const setDefaultDateRange = () => ({
    ...filters,
    ["dateRange"]: { value: "all_time", label: "All Time", from: "", to: "" },
  });

  const resetCustomDatePicker = () => {
    defaultDateRange() && setFilters(setDefaultDateRange());
    hideCustomFilter();
    setSelectedInput("from-input");
  };

  useEffect(() => {
    if (
      filters.dateRange.value == "custom" &&
      !filters.dateRange.from &&
      !filters.dateRange.to &&
      disableDateBtn
    ) {
      setDisableApplyBtn(true);
    } else {
      setDisableApplyBtn(false);
    }
  }, [filters, disableDateBtn]);

  const handleApply = () => {
    setSelectedFilter(filters);
    if (disableApplyBtn) {
      return;
    }

    defaultDateRange()
      ? setFilterParams(setDefaultDateRange())
      : setFilterParams(filters);

    window.localStorage.setItem(
      LocalStorageKeys.REVENUE_FILTERS,
      JSON.stringify(filters)
    );
    setIsFilterVisible(false);
    const dateRangeCount = filters.dateRange.value != "all" ? 1 : 0;
    const ClientCount =
      filters.clients[0].label === "All Clients" ? 0 : filters.clients.length;
    setFilterCounter(ClientCount + dateRangeCount);
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

  const handleClientFilterToggle = () => {
    setIsClientOpen(!isClientOpen);
    setIsDateRangeOpen(false);
  };

  const handleSelectClient = selectedClient => {
    if (filters.clients.includes(selectedClient)) {
      const newarr = filters.clients.filter(
        client => client.value != selectedClient.value
      );

      setFilters({
        ...filters,
        clients: newarr,
      });
    } else {
      if (
        filters.clients.length > 0 &&
        filters.clients[0].label === "All Clients"
      ) {
        filters.clients.splice(0, 1);
      }

      setFilters({
        ...filters,
        clients: [...filters.clients, selectedClient],
      });
    }
  };

  return (
    <SidePanel
      WrapperClassname="z-50 justify-between"
      setFilterVisibilty={setIsFilterVisible}
    >
      <div>
        <SidePanel.Header className="mb-2 flex h-12 items-center justify-between bg-miru-han-purple-1000 px-2 text-white lg:h-auto lg:bg-white lg:px-5 lg:py-5 lg:font-bold lg:text-miru-dark-purple-1000">
          {isDesktop ? (
            <h4 className="flex items-center text-base font-extrabold">
              <FilterIcon className="mr-2.5" size={16} /> <span>Filters</span>
            </h4>
          ) : (
            <span className="flex w-full items-center justify-center pl-6 text-base font-extrabold leading-5">
              Filters
            </span>
          )}
          <Button style="ternary" onClick={() => setIsFilterVisible(false)}>
            <XIcon
              className="text-white lg:text-miru-dark-purple-1000"
              size={16}
            />
          </Button>
        </SidePanel.Header>
        <SidePanel.Body className="sidebar__filters max-h-70v min-h-70v overflow-y-auto lg:max-h-80v lg:min-h-80v">
          <ul>
            <li className="relative cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000 hover:text-miru-han-purple-1000">
              <div
                className="flex items-center justify-between px-5"
                onClick={() => {
                  setIsClientOpen(false);
                  setIsDateRangeOpen(!isDateRangeOpen);
                }}
              >
                <h5 className="text-xs font-bold leading-4 tracking-widest">
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
                      classNameWrapper="px-5 py-3"
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
                <div
                  className="absolute z-20 mt-1 ml-4 flex flex-col overflow-y-auto rounded-lg bg-miru-white-1000 shadow-c1"
                  ref={wrapperRef}
                >
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
                      className={`sidebar__apply
                          ${
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
            <ClientFilter
              filteredClientList={filteredClientList}
              handleClientFilterToggle={handleClientFilterToggle}
              handleSelectClient={handleSelectClient}
              isClientOpen={isClientOpen}
              searchQuery={searchQuery}
              selectedClients={filters.clients}
              setSearchQuery={setSearchQuery}
            />
          </ul>
        </SidePanel.Body>
      </div>
      <SidePanel.Footer className="sidebar__footer h-auto justify-around px-2 pt-1">
        <Button
          className="mr-2 flex items-center justify-between px-10 py-2.5 text-base font-bold leading-5"
          style="secondary"
          onClick={resetFilter}
        >
          RESET
        </Button>
        <Button
          disabled={disableApplyBtn}
          style="primary"
          className={`${
            disableApplyBtn &&
            "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
          } px-10 py-2.5 text-base font-bold leading-5`}
          onClick={handleApply}
        >
          APPLY
        </Button>
      </SidePanel.Footer>
    </SidePanel>
  );
};

export default FilterSideBar;
