/* eslint-disable import/exports-last */

import React from "react";

import Select from "react-select";

import { customErrStyles } from "./CustomErrStyle";
import { customStyles } from "./CustomStyle";
import { CustomValueContainer } from "./CustomValueContainer";

export const CustomReactSelect = ({
  classNamePrefix,
  options,
  label,
  handleOnChange,
  name,
  value,
  isErr,
}) => (
  <div className="outline relative">
    <Select
      classNamePrefix={classNamePrefix}
      name={name}
      options={options}
      placeholder={label}
      styles={isErr ? customErrStyles : customStyles}
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
  placeholder: "Please select...",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  isErr: false,
};
