import * as React from "react";

const CustomRadioButton = ({ text, id, groupName }) => (
  <div className="flex items-center mb-2">
    <input id={id} type="radio" name={groupName} className="hidden custom__radio" />
    <label htmlFor={id} className="flex items-center cursor-pointer text-xl">
      <i className="custom__radio-text"></i>
      <span className="text-sm">{text}</span>
    </label>
  </div>
);

export default CustomRadioButton;
