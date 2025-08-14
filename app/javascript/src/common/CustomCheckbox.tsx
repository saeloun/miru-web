import React from "react";

import classnames from "classnames";

interface CustomCheckboxProps {
  text?: string;
  isChecked?: boolean;
  checkboxValue: any;
  id: any;
  handleCheck: any;
  handleOnClick?: any;
  name?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  isUpdatedDesign?: any;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  text = undefined,
  isChecked = false,
  checkboxValue,
  id,
  handleCheck,
  handleOnClick = () => {
    // Default empty click handler - can be overridden by parent component
  },
  name = "",
  wrapperClassName = "",
  labelClassName = "",
  isUpdatedDesign = false,
}) => (
  <div className={classnames(wrapperClassName)}>
    <div
      className={classnames(
        "grid grid-cols-1 grid-rows-1 content-center justify-items-center"
      )}
    >
      <input
        checked={isChecked}
        id={id}
        name={name}
        type="checkbox"
        value={checkboxValue}
        className={`custom__checkbox col-start-1 row-start-1 grid ${
          isUpdatedDesign ? "h-4 w-4" : "h-3 w-3 md:h-5 md:w-5"
        } cursor-pointer opacity-0`}
        onChange={handleCheck}
        onClick={handleOnClick}
      />
      <div
        className={`col-start-1 row-start-1 ${
          isUpdatedDesign ? "mr-0 h-4 w-4" : "mr-2 h-3 w-3 md:h-5 md:w-5"
        } grid flex-shrink-0 content-center justify-items-center rounded-sm border border-miru-han-purple-1000 bg-white focus-within:border-blue-500 md:border-2`}
      >
        {!isUpdatedDesign ? (
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
              <g
                fill="#5B34EA"
                fillRule="nonzero"
                transform="translate(-9 -11)"
              >
                <path d="m25.576 11.414c0.56558 0.55188 0.56558 1.4439 0 1.9961l-9.404 9.176c-0.28213 0.27529-0.65247 0.41385-1.0228 0.41385-0.37034 0-0.74068-0.13855-1.0228-0.41385l-4.7019-4.588c-0.56584-0.55188-0.56584-1.4442 0-1.9961 0.56558-0.55214 1.4798-0.55214 2.0456 0l3.679 3.5899 8.3812-8.1779c0.56558-0.55214 1.4798-0.55214 2.0456 0z" />
              </g>
            </g>
          </svg>
        ) : (
          <svg
            fill="none"
            height="7"
            viewBox="2 -4 10 15"
            width="10"
            xmlns="http://www.w3.org/2000/svg"
            className={classnames(
              "bold pointer-events-none h-4 w-4 fill-current text-miru-han-purple-1000",
              { hidden: !isChecked }
            )}
          >
            <path
              clipRule="evenodd"
              d="M9.11565 0.477682C9.47315 0.852213 9.45935 1.44564 9.08482 1.80315L4.50146 6.17815C4.13919 6.52395 3.56909 6.52395 3.20682 6.17814L0.915177 3.99064C0.540649 3.63314 0.526852 3.0397 0.884359 2.66518C1.24187 2.29065 1.8353 2.27685 2.20983 2.63436L3.85415 4.20396L7.79018 0.446854C8.16471 0.0893495 8.75815 0.103152 9.11565 0.477682Z"
              fill="#5B34EA"
              fillRule="evenodd"
            />
          </svg>
        )}
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
