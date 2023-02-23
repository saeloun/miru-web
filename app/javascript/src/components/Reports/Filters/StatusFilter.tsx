import React from "react";

import { MinusIcon, PlusIcon } from "miruIcons";

import CustomCheckbox from "common/CustomCheckbox";

const StatusFilter = ({
  setIsClientOpen,
  setIsStatusOpen,
  setIsDateRangeOpen,
  isStatusOpen,
  filters,
  statusOptions,
  handleSelectFilter,
}) => (
  <div className="cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000">
    <div
      className="flex items-center justify-between px-5 hover:text-miru-han-purple-1000"
      onClick={() => {
        setIsDateRangeOpen(false);
        setIsClientOpen(false);
        setIsStatusOpen(!isStatusOpen);
      }}
    >
      <h5 className="text-xs font-bold leading-4 tracking-wider">STATUS</h5>
      <div className="flex items-center">
        {filters.status.length > 0 && (
          <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
            {filters.status.length}
          </span>
        )}
        {isStatusOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
      </div>
    </div>
    {isStatusOpen && (
      <div className="lg:mt-7">
        {statusOptions.length &&
          statusOptions.map(status => (
            <CustomCheckbox
              checkboxValue={status.value}
              handleCheck={event => handleSelectFilter(status, event.target)}
              id={status.value}
              isChecked={filters.status.some(e => e.value === status.value)}
              key={status.value}
              labelClassName="ml-4"
              name="status"
              wrapperClassName="py-3 px-5 flex items-center hover:bg-miru-gray-100"
              text={
                <span className="text-sm capitalize">
                  {status.label.toLowerCase()}
                </span>
              }
            />
          ))}
      </div>
    )}
  </div>
);

export default StatusFilter;
