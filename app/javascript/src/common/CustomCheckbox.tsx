import * as React from "react";

import classnames from "classnames";

const CustomCheckbox = ({
  text = {},
  isChecked = false,
  checkboxValue,
  id,
  handleCheck,
  name = "",
  wrapperClassName = "",
  labelClassName = "",
}) => (
  <div className={classnames("flex items-center", wrapperClassName)}>
    <div
      className={classnames(
        "grid grid-cols-1 grid-rows-1 content-center justify-items-center"
      )}
    >
      <input
        checked={isChecked}
        className="custom__checkbox col-start-1 row-start-1 grid h-5 w-5 cursor-pointer opacity-0"
        data-cy="select-all-checkbox"
        id={id}
        name={name}
        type="checkbox"
        value={checkboxValue}
        onChange={handleCheck}
      />
      <div className="col-start-1 row-start-1 mr-2 grid h-5 w-5 flex-shrink-0 content-center justify-items-center border-2 border-miru-han-purple-1000 bg-white focus-within:border-blue-500">
        <svg
          version="1.1"
          viewBox="0 0 17 12"
          xmlns="http://www.w3.org/2000/svg"
          className={classnames(
            "pointer-events-none h-2 w-2 fill-current text-miru-han-purple-1000",
            { hidden: !isChecked }
          )}
        >
          <g fill="none" fillRule="evenodd">
            <g fill="#5B34EA" fillRule="nonzero" transform="translate(-9 -11)">
              <path d="m25.576 11.414c0.56558 0.55188 0.56558 1.4439 0 1.9961l-9.404 9.176c-0.28213 0.27529-0.65247 0.41385-1.0228 0.41385-0.37034 0-0.74068-0.13855-1.0228-0.41385l-4.7019-4.588c-0.56584-0.55188-0.56584-1.4442 0-1.9961 0.56558-0.55214 1.4798-0.55214 2.0456 0l3.679 3.5899 8.3812-8.1779c0.56558-0.55214 1.4798-0.55214 2.0456 0z" />
            </g>
          </g>
        </svg>
      </div>
    </div>
    {text !== "" && (
      <label
        className={classnames("select-none", labelClassName)}
        htmlFor={name}
      >
        {text}
      </label>
    )}
  </div>
);

export default CustomCheckbox;
