import React from "react";
import Select, { components } from "react-select";
// import reports from "apis/reports";
import { Funnel } from "phosphor-react";

import csvIcon from "../../../../../assets/images/csv_icon.svg";
// import downIcon from "../../../../../assets/images/down_arrow.svg";
import exportIcon from "../../../../../assets/images/export_icon.svg";
import pdfIcon from "../../../../../assets/images/pdf_icon.svg";
import printIcon from "../../../../../assets/images/print_icon.svg";

const options = [
  {
    label: "Export",
    value: 0,
    image: exportIcon
  },
  {
    label: "Export as CSV",
    value: 1,
    image: csvIcon
  },
  {
    label: "Export as PDF",
    value: 2,
    image: pdfIcon
  },
  {
    label: "Print",
    value: 3,
    image: printIcon
  }
];

const Header = ({ setFilterVisibilty, isFilterVisible, downloadPdf }) => {
  const createCSV = async () => {
    const payload = {
      report: { format: "csv" }
    };

    const settings = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    };

    await fetch("internal_api/v1/reports", settings);
    // await reports.create({ payload: { report: { format: "csv" } } });
  };

  const IconSingleValue = (props) => (
    <components.SingleValue {...props}>
      <div className='flex items-center'>
        <img
          src={props.data.image}
          style={{
            height: "30px",
            width: "30px",
            borderRadius: "50%",
            marginRight: "10px"
          }}
        />
        {props.data.label}
      </div>
    </components.SingleValue>
  );

  const IconOption = (props) => (
    <components.Option {...props}>
      <div className='flex items-center'>
        <img
          src={props.data.image}
          style={{
            height: "30px",
            width: "30px",
            borderRadius: "50%",
            marginRight: "10px"
          }}
        />
        {props.data.label}
      </div>
    </components.Option>
  );

  const handleChange = (e) => {
    const value = e.value;

    if (value === 1) {
      createCSV();
    } else if (value === 2) {
      downloadPdf();
    }
  };

  return (
    <div className='sm:flex sm:items-center sm:justify-between mt-6 mb-3'>
      <div className='flex items-center'>
        <h2 className='text-3xl font-extrabold text-gray-900 sm:text-4xl sm:truncate py-1'>
          Time entry report
        </h2>
        <Select
          defaultValue={options[0]}
          className='w-52 cursor-pointer'
          components={{ SingleValue: IconSingleValue, Option: IconOption }}
          isSearchable={false}
          options={options}
          onChange={handleChange}
        />
        <button
          className='ml-7 p-3 rounded hover:bg-miru-gray-1000 relative'
          onClick={() => {
            setFilterVisibilty(!isFilterVisible);
          }}
        >
          <Funnel size={16} color='#7C5DEE' />
          {/* Need to work on below code when integrating the api values */}
          {/* <sup className="filter__counter">3</sup> */}
        </button>
      </div>
    </div>
  );
};

export default Header;
