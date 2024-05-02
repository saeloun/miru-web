import React, { useState, useEffect, useRef } from "react";

import dayjs from "dayjs";
import {
  lineTotalCalc,
  minFromHHMM,
  minToHHMM,
  useOutsideClick,
} from "helpers";
import { DeleteIcon, CalendarIcon } from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";

import CustomDatePicker from "common/CustomDatePicker";

const ManualEntry = ({
  addNew,
  getNewLineItemDropdown,
  lineItem,
  setLineItem,
  manualEntryArr,
  setManualEntryArr,
  setNewLineItemTable,
  setAddNew,
  showNewLineItemTable,
  dateFormat,
}) => {
  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<any>(dayjs().format(dateFormat));
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<any>(0);
  const [lineTotal, setLineTotal] = useState<string>("0");
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(minToHHMM(quantity));
  const [isEnter, setIsEnter] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const wrapperRef = useRef(null);
  const datePickerRef = useRef(null);

  useEffect(() => {
    setLineItem({
      ...lineItem,
      id: manualEntryArr.length + 1,
      name,
      date: dayjs(date, dateFormat).format("YYYY-MM-DD"),
      description,
      rate,
      quantity,
      lineTotal,
    });
  }, [name, date, description, rate, quantity, lineTotal]);

  useEffect(() => {
    if (isEnter) {
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

  const handleDatePicker = selectedDate => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  return (
    <>
      <tr className="my-1 w-full">
        <td className="w-full p-1">
          <input
            className="focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onClick={() => setNewLineItemTable(true)}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="w-full">
          <div
            className="relative"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <input
              disabled
              className="focus:outline-none w-full cursor-pointer appearance-none rounded border-0 border-transparent bg-white p-1 pr-9 pl-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:ring-1 focus:ring-miru-gray-1000"
              placeholder="Select Date"
              type="text"
              value={date || ""}
            />
            <CalendarIcon
              className="absolute top-0 right-0 mx-2 mt-1.5"
              color="#5B34EA"
              size={20}
            />
          </div>
          {showDatePicker && (
            <div ref={datePickerRef}>
              <CustomDatePicker
                date={date || dayjs()}
                dateFormat={dateFormat}
                handleChange={handleDatePicker}
                setVisibility={setShowDatePicker}
                wrapperRef={datePickerRef}
              />
            </div>
          )}
        </td>
        <td className=" w-full">
          <input
            className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Rate"
            type="number"
            value={rate}
            onChange={handleSetRate}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="w-full p-1">
          <input
            className="focus:outline-none w-full rounded bg-white p-1 px-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
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
              className="box-shadow absolute z-40 m-0 w-full rounded bg-white text-sm font-medium text-miru-dark-purple-1000"
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
            placeholder="Enter Description"
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
