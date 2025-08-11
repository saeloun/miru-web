import React from "react";

import {
  customErrStyles,
  customStyles,
  CustomValueContainer,
} from "common/CustomReactSelectStyle";
import AsyncSelect from "react-select/async";

export const CustomAsyncSelect = ({
  classNamePrefix = "react-select-filter",
  loadOptions,
  label = "Select",
  name,
  handleOnChange = () => {},
  value,
  isErr,
  isDesktopView = false,
  ignoreDisabledFontColor = false,
  cacheOptions = false,
  defaultOptions = false,
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
