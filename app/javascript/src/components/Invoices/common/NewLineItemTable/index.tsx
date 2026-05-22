import React, { useEffect } from "react";

import dayjs from "dayjs";
import { lineTotalCalc, minToHHMM } from "helpers";

import TimeEntryPickerHeader from "./TimeEntryPickerHeader";

const NewLineItemTable = ({
  setAddNew,
  filteredLineItems,
  setFilteredLineItems,
  loadMoreItems,
  selectedLineItems,
  setSelectedLineItems,
  setMultiLineItemModal,
  loading,
  setLoading,
  setLineItem,
  dateFormat,
}) => {
  const selectRowId = items => {
    setLineItem({});
    const option = {
      ...items,
      lineTotal: lineTotalCalc(items.quantity, items.rate),
    };
    setAddNew(false);
    setSelectedLineItems([...selectedLineItems, option]);
    setFilteredLineItems([]);
  };

  useEffect(() => {
    filteredLineItems.length < 1 && setLoading(true);
    loadMoreItems();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {filteredLineItems.length > 0 && (
        <TimeEntryPickerHeader
          setLineItem={setLineItem}
          setShowMultilineModal={setMultiLineItemModal}
        />
      )}
      {loading && (
        <p className="tracking-wide flex items-center justify-center text-base font-medium text-primary md:h-50">
          Loading..
        </p>
      )}
      {filteredLineItems.length > 0 && (
        <div className="relative mt-4 flex flex-col overflow-y-auto p-2 md:h-50">
          {filteredLineItems.map((item, index) => {
            const hoursLogged = minToHHMM(item.quantity);
            const date = dayjs(item.date).format(dateFormat);

            return (
              <div
                className="flex cursor-pointer flex-col justify-between py-2 px-3 hover:bg-muted lg:flex-row"
                id="entriesList"
                key={index}
                onClick={() => selectRowId(item)}
              >
                <div className="flex w-full lg:hidden">
                  <span className="w-1/2 text-left text-sm font-medium text-foreground">
                    {item.project_name}
                    <span className="block text-xs text-muted-foreground">
                      {item.first_name} {item.last_name}
                    </span>
                  </span>
                  <span className="w-1/2 text-right text-xs font-medium text-foreground">
                    {date} • {hoursLogged}
                  </span>
                </div>
                <span className="inline w-full whitespace-normal text-left text-xs font-medium text-muted-foreground lg:hidden">
                  {item.description}
                </span>
                <span className="hidden w-1/5 text-left text-sm font-medium text-foreground lg:inline">
                  {item.project_name}
                  <span className="block text-xs text-muted-foreground">
                    {item.first_name} {item.last_name}
                  </span>
                </span>
                <span className="hidden w-3/5 whitespace-normal text-left text-xs font-medium text-muted-foreground lg:inline">
                  {item.description}
                </span>
                <span className="hidden text-right text-xs font-medium text-foreground lg:inline">
                  {date}
                </span>
                <span className="hidden w-1/12 text-right text-xs font-medium text-foreground lg:inline">
                  {hoursLogged}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewLineItemTable;
