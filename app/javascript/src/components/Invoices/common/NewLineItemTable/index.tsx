import React, { useEffect } from "react";

import dayjs from "dayjs";
import { lineTotalCalc, minToHHMM } from "helpers";

import NewLineItemTableHeader from "./Header";

const NewLineItemTable = ({
  setAddNew,
  filteredLineItems, setFilteredLineItems,
  loadMoreItems,
  selectedLineItems, setSelectedLineItems,
  setMultiLineItemModal
}) => {

  const selectRowId = (items) => {
    const option = { ...items, lineTotal: lineTotalCalc(items.quantity, items.rate) };
    setAddNew(false);
    setSelectedLineItems([...selectedLineItems, option]);
    setFilteredLineItems([]);
  };

  useEffect(()=>loadMoreItems(),[]);

  return (
    <div>
      <NewLineItemTableHeader setShowMultilineModal={setMultiLineItemModal}/>
      { filteredLineItems.length > 0 ?
        <div className="overflow-scroll mt-4 h-20 md:h-50 relative">
          {filteredLineItems.map((item, index) => {
            const hoursLogged = minToHHMM(item.quantity);
            const date = dayjs(item.date).format("DD.MM.YYYY");
            return (
              <div key={index} onClick={() => selectRowId(item)} className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100" data-cy="entries-list">
                <span className="font-medium w-1/5 text-sm text-miru-dark-purple-1000 text-left">
                  {item.first_name} {item.last_name}
                </span>
                <span className="font-medium w-3/5 text-xs text-miru-dark-purple-600 text-left whitespace-normal">
                  {item.description}
                </span>
                <span className="font-medium text-xs text-miru-dark-purple-1000 text-right">
                  {date}
                </span>
                <span className="font-medium w-1/12 text-xs text-miru-dark-purple-1000 text-right">
                  {hoursLogged}
                </span>
              </div>
            );
          })
          }
        </div> : <p className="flex items-center justify-center text-miru-han-purple-1000 tracking-wide text-base font-medium md:h-50">No Data Found</p>
      }
    </div>
  );
};

export default NewLineItemTable;
