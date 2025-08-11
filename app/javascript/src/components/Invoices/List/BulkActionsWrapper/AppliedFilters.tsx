import { LocalStorageKeys } from "constants/index";

import React from "react";

import { XIcon } from "miruIcons";

const AppliedFilters = ({
  filterParams,
  filterParamsStr,
  setFilterParams,
  filterIntialValues,
}) => {
  let appliedFilterCount = (filterParamsStr.match(/&/g) || []).length;

  if (filterParamsStr.includes("custom")) {
    appliedFilterCount = appliedFilterCount - 2;
  }

  const handleRemoveFilter = removeval => {
    let name, newArr;

    for (const [key, value] of Object.entries(filterParams)) {
      if (Array.isArray(value)) {
        const hasValue = value.some(v => v === removeval);
        if (hasValue) {
          name = key;
          newArr = value.filter(v => v !== removeval);
        }
      } else if (value === removeval) {
        name = key;
        if (key === "dateRange") {
          newArr = filterIntialValues.dateRange;
        } else {
          newArr = null;
        }
      }
    }

    const updatedFilters = { ...filterParams, [name]: newArr };
    setFilterParams(updatedFilters);
    window.localStorage.setItem(
      LocalStorageKeys.INVOICE_FILTERS,
      JSON.stringify(updatedFilters)
    );
  };

  return (
    <div className="flex flex-col items-start justify-between lg:ml-4 lg:flex-row lg:items-center">
      {Object.values(filterParams).map(param =>
        Array.isArray(param)
          ? param.map(val => (
              <span
                className="my-2 flex h-6 items-center justify-between rounded-xl bg-miru-gray-400 px-2 text-xs font-normal capitalize text-miru-dark-purple-1000 lg:mx-2 lg:my-0"
                key={val.value}
              >
                {val.label}
                <XIcon
                  className="ml-2 cursor-pointer"
                  size={12}
                  onClick={() => handleRemoveFilter(val)}
                />
              </span>
            ))
          : Object(param).value != "all" && (
              <span className="my-2 flex h-6 items-center justify-between rounded-xl bg-miru-gray-400 px-2 text-xs font-normal capitalize text-miru-dark-purple-1000 lg:mx-2 lg:my-0">
                {Object(param).label}
                <XIcon
                  className="ml-2 cursor-pointer"
                  size={12}
                  onClick={() => handleRemoveFilter(Object(param))}
                />
              </span>
            )
      )}
      {appliedFilterCount > 1 && (
        <span
          className="my-2 flex w-16 cursor-pointer items-center justify-between text-xs font-normal text-miru-han-purple-1000 lg:mx-2 lg:my-0"
          onClick={() => {
            window.localStorage.removeItem(LocalStorageKeys.INVOICE_FILTERS);
            setFilterParams(filterIntialValues);
          }}
        >
          <XIcon size={12} /> Clear all
        </span>
      )}
    </div>
  );
};

export default AppliedFilters;
