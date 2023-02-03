/* eslint-disable import/exports-last */

import React from "react";

import AsyncSelect from "react-select/async";

import {
  customErrStyles,
  customStyles,
} from "common/CustomReactSelect/CustomStyle";
import { CustomValueContainer } from "common/CustomReactSelect/CustomValueContainer";

export const CustomAsyncSelect = ({
  classNamePrefix,
  loadOptions,
  label,
  name,
  handleOnChange,
  value,
  isErr,
}) => (
  <div className="outline relative">
    <AsyncSelect
      cacheOptions
      defaultOptions
      classNamePrefix={classNamePrefix}
      loadOptions={loadOptions}
      name={name}
      placeholder={label}
      styles={isErr ? customErrStyles : customStyles}
      value={value || null}
      components={{
        ValueContainer: CustomValueContainer,
        IndicatorSeparator: () => null,
      }}
      onChange={handleOnChange}
    />
  </div>
);

CustomAsyncSelect.defaultProps = {
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Date Format",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
};
