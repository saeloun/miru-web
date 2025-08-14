import React from "react";

import {
  customErrStyles,
  customStyles,
  CustomValueContainer,
} from "common/CustomReactSelectStyle";
import { useUserContext } from "context/UserContext";
import Select from "react-select";

type CustomReactSelectProps = {
  id?: string;
  styles?: any;
  components?: any;
  classNamePrefix?: string;
  label?: string;
  isErr?: any;
  isSearchable?: boolean;
  isDisabled?: boolean;
  ignoreDisabledFontColor?: boolean;
  hideDropdownIndicator?: boolean;
  handleOnClick?: (_e?: any) => void;
  handleOnChange?: (_e?: any) => void;
  handleonFocus?: (_e?: any) => void;
  onBlur?: (_e?: any) => void;
  defaultValue?: object;
  onMenuClose?: (_e?: any) => void;
  onMenuOpen?: (_e?: any) => void;
  className?: string;
  autoFocus?: boolean;
  value?: object;
  getOptionLabel?: (_e?: any) => any;
  wrapperClassName?: string;
  options?: Array<any>;
  name?: string;
  isMulti?: boolean;
};

export const CustomReactSelect = ({
  id = "",
  isSearchable = true,
  classNamePrefix = "react-select-filter",
  options,
  label = "Select",
  handleOnChange = () => {
    /* Default empty handler */
  },
  handleonFocus = () => {
    /* Default empty handler */
  },
  handleOnClick = () => {
    /* Default empty handler */
  },
  name,
  value = null,
  isErr = false,
  isDisabled = false,
  styles = null,
  components = null,
  onMenuClose = () => {
    /* Default empty handler */
  },
  onMenuOpen = () => {
    /* Default empty handler */
  },
  ignoreDisabledFontColor = false,
  hideDropdownIndicator = false,
  className = "",
  autoFocus = false,
  onBlur = () => {
    /* Default empty handler */
  },
  defaultValue = null,
  getOptionLabel,
  wrapperClassName = "",
  isMulti = false,
}: CustomReactSelectProps) => {
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
    <div
      className={`outline relative ${wrapperClassName}`}
      onClick={handleOnClick}
    >
      <Select
        autoFocus={autoFocus}
        className={className}
        classNamePrefix={classNamePrefix}
        defaultValue={defaultValue}
        getOptionLabel={getOptionLabel}
        id={id || name}
        isDisabled={isDisabled}
        isMulti={isMulti}
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
        onBlur={onBlur}
        onChange={handleOnChange}
        onFocus={handleonFocus}
        onMenuClose={onMenuClose}
        onMenuOpen={onMenuOpen}
      />
    </div>
  );
};

export default CustomReactSelect;
