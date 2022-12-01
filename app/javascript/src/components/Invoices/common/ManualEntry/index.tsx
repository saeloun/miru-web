import React, { useState, useEffect, useRef } from "react";

import {
  lineTotalCalc,
  minFromHHMM,
  minToHHMM,
  useOutsideClick,
  useDebounce,
} from "helpers";
import { DeleteIcon } from "miruIcons";
import TextareaAutosize from "react-autosize-textarea";

const ManualEntry = ({
  addNew,
  filteredLineItems,
  getNewLineItemDropdown,
  lineItems,
  manualEntryArr,
  setManualEntryArr,
  setNewLineItemTable,
  setFilteredLineItems,
  setAddNew,
  showNewLineItemTable,
}) => {
  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<any>(0);
  const [lineTotal, setLineTotal] = useState<string>("-");
  const [lineItem, setLineItem] = useState<any>({});
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(minToHHMM(quantity));
  const [isEnter, setIsEnter] = useState<boolean>(false);
  const ref = useRef(null);
  const wrapperRef = useRef(null);
  const debouncedSearchName = useDebounce(name, 500);

  useEffect(() => {
    setLineItem({
      ...lineItem,
      id: manualEntryArr.length + 1,
      name,
      date,
      description,
      rate,
      quantity,
      lineTotal,
    });
  }, [name, date, description, rate, quantity, lineTotal]);

  useEffect(() => {
    if (debouncedSearchName && filteredLineItems.length > 0) {
      const newLineItems = lineItems.filter(item =>
        item.first_name
          .toLowerCase()
          .includes(debouncedSearchName.toLowerCase())
      );

      newLineItems
        ? setFilteredLineItems(newLineItems)
        : setFilteredLineItems([]);
    } else {
      setFilteredLineItems(lineItems);
    }
  }, [debouncedSearchName]);

  useEffect(() => {
    if (isEnter) {
      setManualEntryArr([...manualEntryArr, lineItem]);
      setIsEnter(false);
      setAddNew(false);
    }
  }, [isEnter]);

  const handleDelete = async () => {
    const tempManualEntryArr = [...manualEntryArr];

    const indexOfItem = tempManualEntryArr.findIndex(
      object => object.id === manualEntryArr.length + 1
    );
    indexOfItem !== -1 && tempManualEntryArr.splice(indexOfItem, 1);
    await setManualEntryArr(tempManualEntryArr);
    setAddNew(false);
  };

  const handleEnter = event => {
    if (event.key == "Enter") {
      setIsEnter(true);
    }
  };

  const handleSetRate = e => {
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(quantity, e.target.value));
  };

  const handleSetQuantity = e => {
    const quantityInMin = Number(minFromHHMM(e.target.value));
    setQtyInHHrMin(e.target.value);
    setQuantity(quantityInMin);
    setLineTotal(lineTotalCalc(quantityInMin, rate));
  };

  useOutsideClick(
    wrapperRef,
    () => {
      setNewLineItemTable(false);
    },
    addNew
  );

  return (
    <>
      <tr className="my-1 w-full">
        <td className="w-full p-1">
          <input
            className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onClick={() => setNewLineItemTable(true)}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="w-full">
          <input
            className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Date"
            ref={ref}
            type="text"
            value={date}
            onChange={e => setDate(e.target.value)}
            onFocus={e => (e.target.type = "date")}
            onKeyDown={handleEnter}
          />
        </td>
        <td className=" w-full">
          <input
            className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Rate"
            type="text"
            value={rate}
            onChange={handleSetRate}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="w-full p-1">
          <input
            className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="quantity"
            type="text"
            value={qtyInHHrMin}
            onChange={handleSetQuantity}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="focus:outline-none text-right text-base font-normal text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
          {lineTotal}
        </td>
        <td>
          <button
            className="flex w-full items-center px-2.5 py-4 text-left hover:bg-miru-gray-100"
            onClick={handleDelete}
          >
            <DeleteIcon color="#E04646" size={16} weight="bold" />
          </button>
        </td>
      </tr>
      {showNewLineItemTable && (
        <tr>
          <td className="relative w-full" colSpan={5}>
            <div
              className="box-shadow absolute m-0 w-full rounded bg-white text-sm font-medium text-miru-dark-purple-1000"
              ref={wrapperRef}
            >
              {getNewLineItemDropdown()}
            </div>
          </td>
        </tr>
      )}
      <tr>
        <td className="w-full p-1" colSpan={2}>
          <TextareaAutosize
            className="focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target["value"])}
            onKeyDown={handleEnter}
          />
        </td>
        <td colSpan={3} />
      </tr>
    </>
  );
};

export default ManualEntry;
