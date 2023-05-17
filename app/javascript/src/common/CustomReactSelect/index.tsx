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
  handleOnClick,
  name,
  value,
  isErr,
  isDisabled,
  styles,
  components,
  onMenuClose,
  onMenuOpen,
  ignoreDisabledFontColor,
  hideDropdownIndicator,
  className,
  autoFocus,
}) => {
  const { isDesktop } = useUserContext();

  const getStyle = () => {
    if (isErr) {
      return customErrStyles(isDesktop);
    }

    return customStyles(
      isDesktop,
      ignoreDisabledFontColor,
      hideDropdownIndicator
    );
  };

  return (
    <div className="outline relative" onClick={handleOnClick}>
      <Select
        autoFocus={autoFocus}
        className={className}
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
  id: "",
  styles: null,
  components: null,
  classNamePrefix: "react-select-filter",
  label: "Select",
  placeholder: "Please select...",
  isErr: false,
  isSearchable: true,
  isDisabled: false,
  ignoreDisabledFontColor: false,
  hideDropdownIndicator: false,
  handleOnClick: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  handleonFocus: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  defaultValue: null,
  onMenuClose: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  onMenuOpen: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  className: "",
  autoFocus: false,
};

export default CustomReactSelect;
