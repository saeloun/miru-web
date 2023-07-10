import React from "react";

const log = ({ logs }) => {
  const getPadding = index => {
    if (index == 0) {
      return "p-0";
    }

    return "pt-4";
  };

  const getBorder = index => {
    if (index == logs.length - 1) {
      return "p-0";
    }

    return "pb-4 border-b border-miru-gray-200";
  };

  return (
    <div className="pl-1">
      {logs.map((log, index) => (
        <div
          key={index}
          className={`${getPadding(
            index
          )} relative border-l border-dashed border-miru-gray-1000 pl-6`}
        >
          <div
            className={`absolute ${index == 0 ? "top-0" : "top-5"} -left-2.5`}
          >
            <svg height="20" width="20">
              <ellipse
                className="m-auto"
                cx="10"
                cy="6"
                rx="6"
                ry="6"
                style={{ fill: "#CDD6DF" }}
              />
            </svg>
          </div>
          <div className={`flex flex-col ${getBorder(index)}`}>
            <span className="font-base text-sm capitalize text-miru-dark-purple-1000">
              {log.message}
            </span>
            <span className="mt-2 text-xs font-medium text-miru-dark-purple-200">
              {log.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default log;
