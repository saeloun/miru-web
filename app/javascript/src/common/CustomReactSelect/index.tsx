/* eslint-disable import/exports-last */
import React from "react";

import Select from "react-select";

import {
  customErrStyles,
  customStyles,
  CustomValueContainer,
} from "common/CustomReactSelectStyle";

export const CustomReactSelect = ({
  classNamePrefix,
  options,
  label,
  handleOnChange,
  handleonFocus,
  name,
  value,
  isErr,
  isDesktopView,
  menuIsOpen,
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
        menuIsOpen={menuIsOpen}
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
        onFocus={handleonFocus}
      />
    </div>
  );
};

CustomReactSelect.defaultProps = {
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Please select...",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  handleonFocus: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  isErr: false,
  isDesktopView: true,
  menuIsOpen: false,
};

export default CustomReactSelect;
