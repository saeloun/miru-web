/* eslint-disable import/exports-last */

import React from "react";

import {
  customErrStyles,
  customStyles,
  CustomValueContainer,
} from "common/CustomReactSelectStyle";
import AsyncSelect from "react-select/async";

export const CustomAsyncSelect = ({
  classNamePrefix,
  loadOptions,
  label,
  name,
  handleOnChange,
  value,
  isErr,
  isDesktopView,
  ignoreDisabledFontColor,
  cacheOptions,
  defaultOptions,
}) => {
  const getStyle = () => {
    if (isErr) {
      return customErrStyles(isDesktopView);
    }

    return customStyles(isDesktopView, ignoreDisabledFontColor);
  };

  return (
    <div className="outline relative">
      <AsyncSelect
        cacheOptions={cacheOptions}
        classNamePrefix={classNamePrefix}
        defaultOptions={defaultOptions}
        loadOptions={loadOptions}
        name={name}
        placeholder={label}
        styles={getStyle()}
        value={value || null}
        components={{
          ValueContainer: CustomValueContainer,
          IndicatorSeparator: () => null,
        }}
        onChange={handleOnChange}
      />
    </div>
  );
};

CustomAsyncSelect.defaultProps = {
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Date Format",
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  isDesktopView: false,
  ignoreDisabledFontColor: false,
  cacheOptions: false,
  defaultOptions: false,
};
