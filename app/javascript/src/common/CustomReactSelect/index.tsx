/* eslint-disable import/exports-last */

import React from "react";

import Select from "react-select";

import { customErrStyles, customStyles } from "./CustomStyle";
import { CustomValueContainer } from "./CustomValueContainer";

export const CustomReactSelect = ({
  classNamePrefix,
  options,
  label,
  handleOnChange,
  name,
  value,
  isErr,
  isDesktopView,
}) => {
  const getStyle = () => {
    if (isErr) {
      return customErrStyles(isDesktopView);
    }

    return customStyles(isDesktopView);
  };

  return (
    <div className="outline relative">
      <Select
        classNamePrefix={classNamePrefix}
        name={name}
        options={options}
        placeholder={label}
        styles={getStyle()}
        value={value}
        components={{
          ValueContainer: CustomValueContainer,
          IndicatorSeparator: () => null,
        }}
        onChange={handleOnChange}
      />
    </div>
  );
};

CustomReactSelect.defaultProps = {
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Please select...",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  isErr: false,
  isDesktopView: true,
};
