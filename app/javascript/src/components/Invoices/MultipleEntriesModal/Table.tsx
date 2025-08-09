import React from "react";

import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";

const CheckboxIcon = () => (
  <div className="mr-2 flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 border-miru-han-purple-1000 bg-white focus-within:border-blue-500 lg:h-5 lg:w-5">
    <svg
      className="custom__checkbox-tick pointer-events-none hidden h-2 w-2 fill-current text-miru-han-purple-1000"
      version="1.1"
      viewBox="0 0 17 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" fillRule="evenodd">
        <g fill="#5B34EA" fillRule="nonzero" transform="translate(-9 -11)">
          <path d="m25.576 11.414c0.56558 0.55188 0.56558 1.4439 0 1.9961l-9.404 9.176c-0.28213 0.27529-0.65247 0.41385-1.0228 0.41385-0.37034 0-0.74068-0.13855-1.0228-0.41385l-4.7019-4.588c-0.56584-0.55188-0.56584-1.4442 0-1.9961 0.56558-0.55214 1.4798-0.55214 2.0456 0l3.679 3.5899 8.3812-8.1779c0.56558-0.55214 1.4798-0.55214 2.0456 0z" />
        </g>
      </g>
    </svg>
  </div>
);

const Table = ({
  lineItems,
  handleItemSelection,
  handleSelectAll,
  allCheckboxSelected,
  dateFormat,
}) => {
  const { isDesktop } = useUserContext();

  return (
    <table className="table__width mt-0 lg:mt-4">
      {isDesktop ? (
        <thead>
          <tr>
            <th className="w-2.5">
              <div className="relative flex items-center">
                <input
                  checked={allCheckboxSelected}
                  className="custom__checkbox absolute h-8 w-8 opacity-0"
                  type="checkbox"
                  onChange={handleSelectAll}
                />
                <CheckboxIcon />
              </div>
            </th>
            <th className="table__header w-1/5 p-3 text-left">NAME</th>
            <th className="table__header w-3/5 p-3 text-left">DESCRIPTION</th>
            <th className="table__header p-3 text-right">DATE</th>
            <th className="table__header w-1/12 p-3 text-right">TIME</th>
          </tr>
        </thead>
      ) : (
        <thead>
          <tr>
            <th className="w-2.5">
              <div className="relative flex items-center">
                <input
                  checked={allCheckboxSelected}
                  className="custom__checkbox absolute h-8 w-8 opacity-0"
                  type="checkbox"
                  onChange={handleSelectAll}
                />
                <CheckboxIcon />
              </div>
            </th>
            <th className="table__header w-1/2 p-3 text-left">
              NAME/
              <br />
              DESCRIPTION
            </th>
            <th className="table__header p-3 text-right">
              DATE/
              <br />
              TIME
            </th>
          </tr>
        </thead>
      )}
      <tbody className="overflow-y-scroll">
        {lineItems.map((item, index) => {
          const hoursLogged = minToHHMM(item.quantity);
          const date = dayjs(item.date).format(dateFormat);

          return isDesktop ? (
            <tr key={index}>
              <td className="w-2.5">
                <div className="relative flex items-center">
                  <input
                    checked={item.checked}
                    className="custom__checkbox absolute h-8 w-8 opacity-0"
                    type="checkbox"
                    onChange={() =>
                      handleItemSelection(item.timesheet_entry_id)
                    }
                  />
                  <CheckboxIcon />
                </div>
              </td>
              <td className="table__data w-1/5 text-left text-left text-sm font-medium text-miru-dark-purple-1000">
                {item.first_name} {item.last_name}
              </td>
              <td className="table__data w-3/5 whitespace-normal text-left text-xs font-medium text-miru-dark-purple-600">
                {item.description}
              </td>
              <td className="table__data text-right text-xs font-medium text-miru-dark-purple-1000">
                {date}
              </td>
              <td className="table__data w-1/12 text-right text-xs font-medium text-miru-dark-purple-1000">
                {hoursLogged}
              </td>
            </tr>
          ) : (
            <>
              <tr key={index}>
                <td className="w-2.5 pt-3">
                  <div className="relative flex items-center">
                    <input
                      checked={item.checked}
                      className="custom__checkbox absolute h-4 w-4 opacity-0"
                      type="checkbox"
                      onChange={() =>
                        handleItemSelection(item.timesheet_entry_id)
                      }
                    />
                    <CheckboxIcon />
                  </div>
                </td>
                <td className="w-1/2 pt-3 text-left text-left text-sm font-medium text-miru-dark-purple-1000">
                  {item.first_name} {item.last_name}
                </td>
                <td className="pt-3 text-right text-xs font-medium text-miru-dark-purple-1000">
                  {date} • {hoursLogged}
                </td>
              </tr>
              <tr>
                <td
                  className="border-b border-miru-gray-200 pb-3"
                  colSpan={1}
                />
                <td
                  className="whitespace-normal border-b border-miru-gray-200 pb-3 text-left text-xs font-medium text-miru-dark-purple-400"
                  colSpan={5}
                >
                  {item.description}
                </td>
              </tr>
            </>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
