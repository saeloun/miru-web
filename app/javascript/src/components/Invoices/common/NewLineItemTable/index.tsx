import React from "react";

import dayjs from "dayjs";
import { lineTotalCalc, minToHHMM } from "helpers";
import InfiniteScroll from "react-infinite-scroll-component";

import NewLineItemTableHeader from "./Header";

import { getMaxIdx } from "../utils";

const NewLineItemTable = ({
  setShowItemInputs,
  addNew,
  setAddNew,
  lineItems,
  setLineItems,
  loadMoreItems,
  totalLineItems,
  pageNumber,
  setPageNumber,
  selectedLineItems,
  setSelectedLineItems,
  manualEntryArr,
  setManualEntryArr,
  setMultiLineItemModal,
  setAddManualLineItem,
}) => {
  const hasMoreItems = lineItems.length != totalLineItems;

  const selectRowId = items => {
    const option = {
      ...items,
      lineTotal: lineTotalCalc(items.quantity, items.rate),
    };
    setAddNew(false);
    setSelectedLineItems([...selectedLineItems, option]);
    setLineItems([]);
    setPageNumber(1);
  };

  const addManualEntryItem = () => {
    setShowItemInputs(true);
    setAddNew(!addNew);
    setAddManualLineItem(true);
    setManualEntryArr([
      ...manualEntryArr,
      { idx: getMaxIdx(manualEntryArr) + 1 },
    ]);
  };

  return (
    <div>
      <NewLineItemTableHeader
        addManualEntryItem={addManualEntryItem}
        setShowMultilineModal={setMultiLineItemModal}
      />
      <div className="relative mt-4 overflow-scroll">
        <InfiniteScroll
          dataLength={pageNumber * 10}
          hasMore={hasMoreItems}
          height={250}
          next={loadMoreItems}
          endMessage={
            <p className="py-2 text-center">
              <b>End of the list</b>
            </p>
          }
          loader={
            <div className="py-2 text-center">
              <h4>Loading...</h4>
            </div>
          }
        >
          {lineItems.map((item, index) => {
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
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default NewLineItemTable;
