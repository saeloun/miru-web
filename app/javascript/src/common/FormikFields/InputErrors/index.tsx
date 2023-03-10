import React from "react";

const InputErrors = ({ fieldErrors, fieldTouched }) => (
  <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
    {fieldErrors && fieldTouched && <div>{fieldErrors}</div>}
  </div>
);

export default InputErrors;
