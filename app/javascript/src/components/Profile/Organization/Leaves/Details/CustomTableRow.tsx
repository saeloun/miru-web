import React, { Fragment } from "react";

const CustomTableRow = ({ leave, key }) => {
  const {
    customLeaveType,
    customLeaveTotal,
    customAllocationPeriod,
    employees,
  } = leave;

  return (
    <tr className="flex w-full" key={key}>
      <td className="flex w-4/12 cursor-pointer items-center border-b border-miru-gray-400 py-6 pr-2">
        <span className="text-left text-sm font-medium text-miru-dark-purple-1000">
          {customLeaveType}
        </span>
      </td>
      <td
        className="flex w-4/12 items-center border-b border-miru-gray-400 py-6 pr-2 text-left text-sm font-medium text-miru-dark-purple-1000"
        scope="col"
      >
        {customLeaveTotal} {customAllocationPeriod}
      </td>
      <td
        className="flex w-4/12 flex-wrap items-center break-normal border-b border-miru-gray-400 py-6 pr-2 text-left text-sm font-medium text-miru-dark-purple-1000"
        scope="col"
      >
        {employees.map((emp, index) => (
          <Fragment key={emp.value}>
            <span>{emp.label}</span>{" "}
            {index < employees.length - 1 && <span>,</span>}
          </Fragment>
        ))}
      </td>
    </tr>
  );
};

export default CustomTableRow;
