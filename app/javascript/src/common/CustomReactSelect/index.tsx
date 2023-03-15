/* eslint-disable import/exports-last */
import React from "react";

import Select from "react-select";

import {
  customErrStyles,
  customStyles,
  CustomValueContainer,
} from "common/CustomReactSelectStyle";
import { useUserContext } from "context/UserContext";

export const CustomReactSelect = ({
  classNamePrefix,
  options,
  label,
  handleOnChange,
  handleonFocus,
  name,
  value,
  isErr,
  isDisabled,
}) => {
  const { isDesktop } = useUserContext();

  const getStyle = () => {
    if (isErr) {
      return customErrStyles(isDesktop);
    }

    return customStyles(isDesktop);
  };

  return (
    <div className="outline relative">
      <Select
        classNamePrefix={classNamePrefix}
        isDisabled={isDisabled}
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
  isDisabled: false,
};

export default CustomReactSelect;
