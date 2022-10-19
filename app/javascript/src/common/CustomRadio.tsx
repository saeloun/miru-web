import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE_WRAPPER = "flex items-center cursor-pointer hover:bg-miru-gray-100";
const DEFAULT_STYLE_LABEL = "text-sm text-miru-dark-purple-1000 font-normal leading-5 ml-4";
const DEFAULT_STYLE_INPUT = "hidden w-3 h-3 custom__radio";
const DEFAULT_STYLE_RADIO_ICON = "w-3 h-3 inline-block mr-2 rounded-full border border-miru-han-purple-1000";

type RadioProps = {
  id?: string;
  label?: string | number;
  value: string,
  groupName?: string;
  defaultCheck?: boolean;
  classNameLabel?: string;
  classNameInput?: string;
  classNameWrapper?: string;
  classNameRadioIcon?: string;
  handleOnChange?: any
};

const CustomRadioButton = ({
  id,
  label,
  value,
  groupName,
  defaultCheck,
  classNameLabel = "",
  classNameInput = "",
  classNameWrapper = "",
  classNameRadioIcon = "",
  handleOnChange = ()=>{} //eslint-disable-line
}: RadioProps) => (
  <div className={classnames(DEFAULT_STYLE_WRAPPER, classNameWrapper)}>
    <input
      id={id}
      type="radio"
      value={value}
      name={groupName}
      defaultChecked={defaultCheck}
      className={classnames(DEFAULT_STYLE_INPUT, classNameInput)}
      onChange={handleOnChange}
    />
    <label
      htmlFor={id}
      className={classnames("flex items-center cursor-pointer")}
    >
      <i
        className={classnames(DEFAULT_STYLE_RADIO_ICON, classNameRadioIcon)}
      ></i>
      <span className={classnames(DEFAULT_STYLE_LABEL, classNameLabel)}>
        {label}
      </span>
    </label>
  </div>
);

export default CustomRadioButton;
