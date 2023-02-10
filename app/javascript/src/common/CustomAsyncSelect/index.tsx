/* eslint-disable import/exports-last */

import React from "react";

import AsyncSelect from "react-select/async";

import { CustomValueContainer } from "common/CustomReactSelect/CustomValueContainer";

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

export const CustomAsyncSelect = ({
  classNamePrefix,
  loadOptions,
  label,
  name,
}) => (
  <div className="outline relative">
    <AsyncSelect
      cacheOptions
      defaultOptions
      classNamePrefix={classNamePrefix}
      loadOptions={loadOptions}
      name={name}
      placeholder={label}
      styles={customStyles}
      components={{
        ValueContainer: CustomValueContainer,
        IndicatorSeparator: () => null,
      }}
    />
  </div>
);

CustomAsyncSelect.defaultProps = {
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Date Format",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
};
