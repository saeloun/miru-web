import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import { DropdownHeader } from "./CustomComponents";

const NewLineItemTable = ({
  setShowItemInputs,
  addNew, setAddNew,
  lineItems, setLineItems,
  loadMoreItems,
  totalLineItems,
  pageNumber, setPageNumber,
  selectedOption,
  setSelectedOption,
  setMultiLineItemModal,
  manualEntryArr,
  setManualEntryArr,
  setAddManualLineItem
}) => {

  const hasMoreItems = lineItems.length === totalLineItems;
  const selectRowId = (items) => {
    const option = { ...items, lineTotal: (Number(items.qty) / 60 * Number(items.rate)) };
    setAddNew(false);
    setSelectedOption([...selectedOption, option]);
    setLineItems([]);
    setPageNumber(1);
  };

  return (
    <div>
      <DropdownHeader setShowMultilineModal={setMultiLineItemModal} />
      <div>
        <button onClick={async () => {
          await setShowItemInputs(true);
          setAddNew(!addNew);
          setAddManualLineItem(true);
          setManualEntryArr([...manualEntryArr, { idx: manualEntryArr.length  + 1 }]);
        }} className="mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">Add Manual Entry</button>
      </div>
      <div className="overflow-scroll mt-4 relative">
        <InfiniteScroll
          dataLength={pageNumber * 10}
          next={loadMoreItems}
          hasMore={!hasMoreItems}
          loader={
            <div className="text-center py-2">
              <h4>Loading...</h4>
            </div>
          }
          height={250}
          endMessage={
            <p className="text-center py-2">
              <b>End of the list</b>
            </p>
          }
        >
          {lineItems.map((item, index) => {
            const hoursLogged = (item.qty / 60).toFixed(2);
            const date = dayjs(item.date).format("DD.MM.YYYY");
            return (
              <div key={index} onClick={() => { selectRowId(item); }} className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100">
                <span className="font-medium w-1/4 text-base text-miru-dark-purple-1000 text-left">
                  {item.first_name} {item.last_name}
                </span>
                <span className="font-medium w-2/4 text-xs text-miru-dark-purple-600 text-left w-1/2">
                  {item.description}
                </span>
                <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
                  {date}
                </span>
                <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
                  {hoursLogged}
                </span>
              </div>
            );
          })
          }
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default NewLineItemTable;
