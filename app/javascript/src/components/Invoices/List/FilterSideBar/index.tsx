import * as React from "react";
import Select from "react-select";
import { X } from "phosphor-react";

import getStatusCssClass from "utils/getStatusTag";

//Json Should be removed once we start integrating the api.
const FilterSideBar = ({ setFilterVisibilty }) => {
  const dateRangeOptions = [
    { value: "", label: "All" },
    { value: "cwa", label: "This month (1st Dec - 31st Dec)" },
    { value: "alexa", label: "Last Month (1st Nov - 30th Nov)" },
    { value: "abc", label: "This Week (27th Dec - 2nd Jan)" },
    { value: "dwss", label: "Last Week (20th Dec - 26th Dec)" }
  ];
  const projectOption = [
    { value: "onedrive", label: "One Drive" },
    { value: "cwa", label: "Outlook" },
    { value: "alexa", label: "Alexa" },
    { value: "abc", label: "One Drive" },
    { value: "dwss", label: "Outlook" },
    { value: "rrr", label: "Alexa" },
    { value: "xyz", label: "One Drive" },
    { value: "outlook", label: "Outlook" },
    { value: "pppp", label: "Alexa" }
  ];

  const statusOption = [
    { value: "overdue", label: "OVERDUE" },
    { value: "sent", label: "SENT" },
    { value: "paid", label: "PAID" }
  ];

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
              <Select isMulti={true} classNamePrefix="react-select-filter" styles={customStyles} options={dateRangeOptions} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">PROJECTS</h5>
              <Select isMulti={true} classNamePrefix="react-select-filter" styles={customStyles} options={projectOption} />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">STATUS</h5>
              <Select isMulti={true} classNamePrefix="react-select-filter" styles={customStyles} options={statusOption} components={{ Option: CustomOption }} />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button className="sidebar__reset">RESET</button>
        <button className="sidebar__apply">APPLY</button>
      </div>
    </div>
  );
};

export default FilterSideBar;
