import React, { useEffect } from "react";

import dayjs from "dayjs";
import { lineTotalCalc, minToHHMM } from "helpers";

import NewLineItemTableHeader from "./Header";

const NewLineItemTable = ({
  setAddNew,
  filteredLineItems,
  setFilteredLineItems,
  loadMoreItems,
  selectedLineItems,
  setSelectedLineItems,
  setMultiLineItemModal,
}) => {
  const selectRowId = items => {
    const option = {
      ...items,
      lineTotal: lineTotalCalc(items.quantity, items.rate),
    };
    setAddNew(false);
    setSelectedLineItems([...selectedLineItems, option]);
    setFilteredLineItems([]);
  };

  useEffect(() => loadMoreItems(), []);

  return (
    <div>
      <NewLineItemTableHeader setShowMultilineModal={setMultiLineItemModal} />
      {filteredLineItems.length > 0 ? (
        <div className="relative mt-4 h-20 overflow-scroll md:h-50">
          {filteredLineItems.map((item, index) => {
            const hoursLogged = minToHHMM(item.quantity);
            const date = dayjs(item.date).format("DD.MM.YYYY");

            return (
              <div
                className="flex cursor-pointer justify-between py-2 px-3 hover:bg-miru-gray-100"
                data-cy="entries-list"
                key={index}
                onClick={() => selectRowId(item)}
              >
                <span className="w-1/5 text-left text-sm font-medium text-miru-dark-purple-1000">
                  {item.first_name} {item.last_name}
                </span>
                <span className="w-3/5 whitespace-normal text-left text-xs font-medium text-miru-dark-purple-600">
                  {item.description}
                </span>
                <span className="text-right text-xs font-medium text-miru-dark-purple-1000">
                  {date}
                </span>
                <span className="w-1/12 text-right text-xs font-medium text-miru-dark-purple-1000">
                  {hoursLogged}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000 md:h-50">
          No Data Found
        </p>
      )}
    </div>
  );
};

export default NewLineItemTable;
