import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE_WRAPPER = "flex items-center cursor-pointer";

const DEFAULT_STYLE_LABEL =
  "text-sm text-miru-dark-purple-1000 font-normal leading-5";
const DEFAULT_STYLE_INPUT = "hidden w-3 h-3 custom__radio";
const DEFAULT_STYLE_RADIO_ICON =
  "w-3 h-3 inline-block mr-2 rounded-full border border-miru-han-purple-1000";

type RadioProps = {
  id?: string;
  label?: string | number;
  value: string;
  groupName?: string;
  defaultCheck?: boolean;
  classNameLabel?: string;
  classNameInput?: string;
  classNameWrapper?: string;
  classNameRadioIcon?: string;
  handleOnChange?: any;
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
  handleOnChange = () => {},
}: RadioProps) => (
  <div className={classnames(DEFAULT_STYLE_WRAPPER, classNameWrapper)}>
    <input
      checked={defaultCheck}
      className={classnames(DEFAULT_STYLE_INPUT, classNameInput)}
      id={id}
      name={groupName}
      type="radio"
      value={value}
      onChange={handleOnChange}
    />
    <label
      className={classnames("flex cursor-pointer items-center")}
      htmlFor={id}
    >
      <i className={classnames(DEFAULT_STYLE_RADIO_ICON, classNameRadioIcon)} />
      <span className={classnames(DEFAULT_STYLE_LABEL, classNameLabel)}>
        {label}
      </span>
    </label>
  </div>
);

export default CustomRadioButton;
