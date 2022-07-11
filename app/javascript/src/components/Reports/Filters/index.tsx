import React, { useState } from "react";
import Select from "react-select";
import { X } from "phosphor-react";
import {
  dateRangeOptions,
  statusOption,
  groupBy
} from "./filterOptions";
import { customStyles } from "./style";
import getStatusCssClass from "../../../utils/getStatusTag";
import { useEntry } from "../context/EntryContext";

const FilterSideBar = ({
  setFilterVisibilty,
  resetFilter,
  handleApplyFilter
}) => {

  const { timeEntryReport } = useEntry();
  const [filters, setFilters] = useState(timeEntryReport.selectedFilter);

  const handleSelectFilter = (selectedValue, field) => {
    if (Array.isArray(selectedValue)) {
      setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
    else {
      setFilters({
        ...filters,
        [field.name]: selectedValue
      });
    }
  };

  const submitApplyFilter = () => {
    handleApplyFilter(filters);
  };

  const CustomOption = (props) => {
    const { innerProps, innerRef } = props;
    return (
      <div ref={innerRef} {...innerProps} className="py-1 px-2 cursor-pointer hover:bg-miru-gray-100">
        <span className={`${getStatusCssClass(props.data.value)} text-xs tracking-widest`} >
          {props.data.label}
        </span>
      </div>
    );
  };

  return (
    <div className="sidebar__container flex flex-col overflow-y-auto">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
          <h4 className="text-base font-bold">
            Filters
          </h4>
          <button onClick={() => setFilterVisibilty(false)}>
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
                onChange={handleSelectFilter}
                name="dateRange"
                styles={customStyles}
                options={dateRangeOptions}
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Clients</h5>
              <Select isMulti={true} value={filters.clients} classNamePrefix="react-select-filter" name="clients" onChange={handleSelectFilter} styles={customStyles} options={timeEntryReport.filterOptions.clients} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Team Members</h5>
              <Select isMulti={true} value={filters.teamMember} classNamePrefix="react-select-filter" name="teamMember" onChange={handleSelectFilter} styles={customStyles} options={timeEntryReport.filterOptions.teamMembers} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Status</h5>
              <Select isMulti={true} value={filters.status} classNamePrefix="react-select-filter" name="status" onChange={handleSelectFilter} styles={customStyles} options={statusOption} components={{ Option: CustomOption }} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Group By</h5>
              <Select
                classNamePrefix="react-select-filter"
                value={filters.groupBy}
                styles={customStyles}
                name="groupBy"
                onChange={handleSelectFilter}
                options={groupBy}
              />
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
