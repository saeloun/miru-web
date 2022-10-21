import React, { useEffect, useState } from "react";

import Logger from "js-logger";
import { X } from "phosphor-react";
import Select from "react-select";
import * as Yup from "yup";

import clientApi from "apis/clients";
import CustomDateRangePicker from "common/CustomDateRangePicker";

import {
  dateRangeOptions
} from "./filterOptions";
import { customStyles } from "./style";

import { useEntry } from "../../context/EntryContext";

const dateSchema = Yup.object().shape({
  fromDate: Yup.string().required("Must include From date"),
  toDate: Yup.string().required("Must include To date")
});

const FilterSideBar = ({
  selectedFilter,
  setFilterVisibilty: setFilterVisibility, // TODO: fix typo setFilterVisibility
  resetFilter,
  handleApplyFilter,
  handleSelectDate,
  onClickInput,
  selectedInput,
  dateRange
}) => {
  const { revenueByClientReport } = useEntry();
  const [filters, setFilters] = useState(revenueByClientReport.selectedFilter);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    fromDateErr: "",
    toDateErr: ""
  });
  const [clientList, setClientList] = useState([]);

  const selectedClients = selectedFilter["clients"][0]["value"] === "" ? selectedFilter["clients"].slice(1) : selectedFilter["clients"];

  useEffect(() => {
    fetchAndSetClients();
  }, []);

  const fetchAndSetClients = async () => {
    try {
      const { data } = await clientApi.get("");
      setClientList(
        data.client_details.map(client => ({ value: client.id, label: client.name }))
      );
    } catch {
      Logger.error("Error fetching clients");
    }
  };

  const handleSelectClientFilter = (selectedValue) => {
    if (Array.isArray(selectedValue) && selectedValue.length > 0) {
      setFilters({
        ...filters,
        clients: selectedValue
      });
    }
    else {
      setFilters({
        ...filters,
        clients: [{ label: "All Clients" , value: "" }]
      });
    }
  };

  const handleSelectDateFilter = (selectedValue) => {
    if (selectedValue.value === "custom") {
      setShowCustomFilter(true);
    }

    setFilters({
      ...filters,
      dateRange: selectedValue
    });
  };

  const submitApplyFilter = () => {
    handleApplyFilter(filters);
  };

  const hideCustomFilter = () => {
    setShowCustomFilter(false);
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
    <div className="sidebar__container flex flex-col min-w-max	">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
          <h4 className="text-base font-bold">
            Filters
          </h4>
          <button onClick={() => setFilterVisibility(false)}>
            <X size={12} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Date Range</h5>
              <Select
                classNamePrefix="react-select-filter"
                value={filters.dateRange}
                onChange={handleSelectDateFilter}
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
              <Select isMulti={true} defaultValue={selectedClients} options={clientList} classNamePrefix="react-select-filter" name="clients" onChange={handleSelectClientFilter} styles={customStyles}/>
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
