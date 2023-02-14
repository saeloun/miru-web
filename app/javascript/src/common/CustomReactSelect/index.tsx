/* eslint-disable import/exports-last */

import React from "react";

import Select from "react-select";

import { CustomValueContainer } from "./CustomValueContainer";

const customStyles = {
  control: provided => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    color: "red",
    minHeight: 48,
    padding: "0",
    border: "1px solid #CDD6DF",
    "border-color": "#CDD6DF",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-40%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 9,
    backgroundColor: "#FFFFFF",
  }),
  dropdownIndicator: base => ({
    ...base,
    color: "#5B34EA", // Custom colour
  }),
};

export const CustomReactSelect = ({
  classNamePrefix,
  options,
  label,
  handleOnChange,
  name,
  value,
}) => (
  <div className="outline relative">
    <Select
      classNamePrefix={classNamePrefix}
      name={name}
      options={options}
      placeholder={label}
      styles={customStyles}
      value={value}
      components={{
        ValueContainer: CustomValueContainer,
        IndicatorSeparator: () => null,
      }}
      onChange={handleOnChange}
    />
  </div>
);

CustomReactSelect.defaultProps = {
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Date Format",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
};
