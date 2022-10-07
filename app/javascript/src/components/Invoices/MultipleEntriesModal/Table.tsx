import React from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import InfiniteScroll from "react-infinite-scroll-component";

const CheckboxIcon = () => <div className="bg-white border-2 border-miru-han-purple-1000 w-5 h-5 flex flex-shrink-0 justify-center items-center mr-2 focus-within:border-blue-500">
  <svg className="custom__checkbox-tick fill-current hidden w-2 h-2 text-miru-han-purple-1000 pointer-events-none" version="1.1" viewBox="0 0 17 12" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <g transform="translate(-9 -11)" fill="#5B34EA" fillRule="nonzero">
        <path d="m25.576 11.414c0.56558 0.55188 0.56558 1.4439 0 1.9961l-9.404 9.176c-0.28213 0.27529-0.65247 0.41385-1.0228 0.41385-0.37034 0-0.74068-0.13855-1.0228-0.41385l-4.7019-4.588c-0.56584-0.55188-0.56584-1.4442 0-1.9961 0.56558-0.55214 1.4798-0.55214 2.0456 0l3.679 3.5899 8.3812-8.1779c0.56558-0.55214 1.4798-0.55214 2.0456 0z" />
      </g>
    </g>
  </svg>
</div>;

const Table = ({
  lineItems,
  pageNumber,
  loadMore,
  totalLineItems,
  handleItemSelection,
  handleSelectAll,
  allCheckboxSelected
}) => {
  const hasMore = lineItems.length !== totalLineItems;
  return (
    <table className="table__width">
      <thead>
        <tr>
          <th className="w-2.5">
            <div className="flex items-center relative">
              <input type="checkbox" className="opacity-0 absolute h-8 w-8 custom__checkbox" checked={allCheckboxSelected} onChange={handleSelectAll} />
              <CheckboxIcon />
            </div>
          </th>
          <th className="table__header w-1/5 text-left p-3">NAME</th>
          <th className="table__header w-3/5 text-left p-3">DESCRIPTION</th>
          <th className="table__header text-right p-3">DATE</th>
          <th className="table__header w-1/12 text-right p-3">TIME</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={5}>
            <InfiniteScroll
              dataLength={pageNumber * 10}
              next={loadMore}
              hasMore={hasMore}
              height={390}
              loader={<h4>Please wait loading more...</h4>}
            >
              <table className="w-full">
                <tbody>
                  {lineItems.map((item, index) => {
                    const hoursLogged = minToHHMM(item.quantity);
                    const date = dayjs(item.date).format("DD.MM.YYYY");
                    return (
                      <tr key={index}>
                        <td className="w-2.5">
                          <div className="flex items-center relative">
                            <input type="checkbox" className="opacity-0 absolute h-8 w-8 custom__checkbox" onChange={() => handleItemSelection(item.timesheet_entry_id)} checked={item.checked} />
                            <CheckboxIcon />
                          </div>
                        </td>
                        <td className="table__data font-medium w-1/5 text-sm text-miru-dark-purple-1000 text-left text-left">
                          {item.first_name} {item.last_name}
                        </td>
                        <td className="table__data font-medium w-3/5 text-xs text-miru-dark-purple-600 text-left whitespace-normal">
                          {item.description}
                        </td>
                        <td className="table__data font-medium text-xs text-miru-dark-purple-1000 text-right">
                          {date}
                        </td>
                        <td className="table__data font-medium w-1/12 text-xs text-miru-dark-purple-1000 text-right">
                          {hoursLogged}
                        </td>
                      </tr>
                    );
                  }
                  )}
                </tbody>
              </table>
            </InfiniteScroll>
          </td>
        </tr>
      </tbody>
    </table>

  );
};

export default Table;
