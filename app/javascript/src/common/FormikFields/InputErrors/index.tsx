import React from "react";

const InputErrors = ({ fieldErrors, fieldTouched, addMargin = true }) =>
  fieldErrors && fieldTouched ? (
    <div
      className={`mx-0 ${
        addMargin && "mb-6"
      } block text-xs tracking-wider text-red-600`}
    >
      <div>{fieldErrors}</div>
    </div>
  ) : null;

export default InputErrors;
