import React, { useState, useRef } from "react";

import { CaretDown } from "phosphor-react";
import Select from "react-select";

import { DropdownIndicator } from "components/Invoices/Generate/CustomComponents";
import { reactSelectStyles } from "components/Invoices/Generate/Styles";
import useOutsideClick from "helpers/outsideClick";

const SearchTimeEntries = ({
  selectedEmployeeId,
  setSelectedEmployeeId,
  employeeList
}) => {
  const [employeeVisible, setEmployeeVisible] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setEmployeeVisible(false), employeeVisible);

  const currentUser = employeeList?.find((emp) => emp.value == selectedEmployeeId);

  const handleClick = async () => {
    setEmployeeVisible(!employeeVisible);
  };

  const handleEmployeeChange = (selection) => {
    setSelectedEmployeeId(selection["value"]);
    setEmployeeVisible(false);
  };

  return (
    <div className="flex justify-center items-center">
      <p className="text-xs font-medium justify-center mr-2">Viewing time entries for</p>
      <div className="group" ref={wrapperRef}>
        <p className="font-medium text-base text-miru-han-purple-1000 flex">{currentUser?.label}
          <button
            className="mx-1 font-bold"
            onClick={handleClick}
          >
            <CaretDown size={16} color="#5B34EA" weight="bold" />
          </button>
        </p>

        {employeeVisible && (
          <Select
            defaultValue={null}
            onChange={handleEmployeeChange}
            options={employeeList}
            placeholder="Search"
            isSearchable={true}
            className="m-0 mt-2 w-52 text-white"
            classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
            defaultMenuIsOpen={true}
            styles={reactSelectStyles.InvoiceDetails}
            components={{ DropdownIndicator, IndicatorSeparator: () => null }}
          />
        )}
      </div>
    </div>
  );
};

export default SearchTimeEntries;
