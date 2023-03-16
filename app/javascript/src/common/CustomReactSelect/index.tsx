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
  id,
  isSearchable,
  classNamePrefix,
  options,
  label,
  handleOnChange,
  handleonFocus,
  name,
  value,
  isErr,
  isDisabled,
  styles,
  components,
  onMenuClose,
  onMenuOpen,
  ignoreDisabledFontColor,
}) => {
  const { isDesktop } = useUserContext();

  const getStyle = () => {
    if (isErr) {
      return customErrStyles(isDesktop);
    }

    return customStyles(isDesktop, ignoreDisabledFontColor);
  };

  return (
    <div className="outline relative">
      <Select
        classNamePrefix={classNamePrefix}
        id={id || name}
        isDisabled={isDisabled}
        isSearchable={isSearchable}
        name={name}
        options={options}
        placeholder={label}
        styles={styles || getStyle()}
        value={value}
        components={
          components || {
            ValueContainer: CustomValueContainer,
            IndicatorSeparator: () => null,
          }
        }
        onChange={handleOnChange}
        onFocus={handleonFocus}
        onMenuClose={onMenuClose}
        onMenuOpen={onMenuOpen}
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
  defaultValue: null,
  onMenuClose: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  onMenuOpen: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  styles: null,
  isSearchable: true,
  components: null,
  ignoreDisabledFontColor: false,
  id: "",
};

export default CustomReactSelect;
