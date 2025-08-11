/* eslint-disable import/exports-last */
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
  handleOnClick?: (e?: any) => void; // eslint-disable-line
  handleOnChange?: (e?: any) => void; // eslint-disable-line
  handleonFocus?: (e?: any) => void; // eslint-disable-line
  onBlur?: (e?: any) => void; // eslint-disable-line
  defaultValue?: object;
  onMenuClose?: (e?: any) => void; // eslint-disable-line
  onMenuOpen?: (e?: any) => void; // eslint-disable-line
  className?: string;
  autoFocus?: boolean;
  value?: object;
  getOptionLabel?: (e?: any) => any; // eslint-disable-line
  wrapperClassName?: string;
  options?: Array<any>;
  name?: string;
  isMulti?: boolean;
};

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
  onBlur,
  defaultValue,
  getOptionLabel,
  wrapperClassName,
  isMulti,
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

CustomReactSelect.defaultProps = {
  id: "",
  styles: null,
  components: null,
  classNamePrefix: "react-select-filter",
  label: "Select",
  isErr: false,
  isSearchable: true,
  isDisabled: false,
  ignoreDisabledFontColor: false,
  hideDropdownIndicator: false,
  handleOnClick: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  handleOnChange: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  handleonFocus: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  onBlur: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  defaultValue: null,
  onMenuClose: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  onMenuOpen: () => {}, // eslint-disable-line  @typescript-eslint/no-empty-function
  className: "",
  autoFocus: false,
  value: null,
  wrapperClassName: "",
  isMulti: false,
};

export default CustomReactSelect;
