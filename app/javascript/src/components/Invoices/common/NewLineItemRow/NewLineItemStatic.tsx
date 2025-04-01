import React, { useRef, useState, useEffect } from "react";

import dayjs from "dayjs";
import { minFromHHMM, minToHHMM, lineTotalCalc, currencyFormat } from "helpers";
import { DeleteIcon, CalendarIcon } from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";

import CustomDatePicker from "common/CustomDatePicker";

const NewLineItemStatic = ({
  clientCurrency,
  item,
  handleDelete,
  setSelectedOption,
  selectedOption,
  dateFormat,
}) => {
  const strName = item.name || `${item.first_name} ${item.last_name}`;
  const [name, setName] = useState<string>(strName);
  const [lineItemDate, setLineItemDate] = useState(
    dayjs(item.date, "YYYY-MM-DD").format(dateFormat)
  );
  const [description, setDescription] = useState<string>(item.description);
  const [rate, setRate] = useState<number>(item.rate);
  const [quantity, setQuantity] = useState<any>(minToHHMM(item.quantity));
  const [lineTotal, setLineTotal] = useState<string>(item.lineTotal);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showCalendarIcon, setShowCalendarIcon] = useState<boolean>(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    const names = name.split(" ");
    const newItem = {
      ...item,
      first_name: names.splice(0, 1)[0],
      last_name: names.join(" "),
      name,
      date: lineItemDate,
      description,
      rate,
      quantity: minFromHHMM(quantity),
      lineTotal,
    };

    const selectedOptionArr = selectedOption.map(option => {
      if (
        (option.id && option.id === item.id) ||
        (option.timesheet_entry_id &&
          option.timesheet_entry_id === item.timesheet_entry_id)
      ) {
        return newItem;
      }

      return option;
    });

    name && setSelectedOption(selectedOptionArr);
  }, [name, lineItemDate, description, quantity, rate, lineTotal]);

  const closeEditField = event => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  const handleSetRate = e => {
    const qtyInMin = Number(minFromHHMM(quantity));
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(qtyInMin, e.target.value));
  };

  const handleSetQuantity = e => {
    const qtyInMin = Number(minFromHHMM(e.target.value));
    setQuantity(e.target.value);
    setLineTotal(lineTotalCalc(qtyInMin, rate));
  };

  const handleDatePicker = selectedDate => {
    setLineItemDate(selectedDate);
    setShowDatePicker(false);
  };

  return (
    <>
      <tr className="invoice-items-row cursor-pointer">
        <td className="px-1 py-3 text-left text-base font-normal text-miru-dark-purple-1000 ">
          <input
            className="focus:outline-none w-full rounded bg-transparent p-1 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
            placeholder={name}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="relative px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
          <div onClick={() => setShowDatePicker(!showDatePicker)}>
            <input
              placeholder="Select Date"
              type="text"
              value={lineItemDate}
              className={`focus:outline-none w-full cursor-pointer appearance-none rounded border-0 border-transparent bg-transparent p-1 pl-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:bg-white focus:bg-white focus:ring-1 focus:ring-miru-gray-1000 ${
                showCalendarIcon ? "pr-9" : "pr-1"
              }`}
              onBlur={() => setShowCalendarIcon(false)}
              onFocus={() => setShowCalendarIcon(true)}
              onKeyDown={closeEditField}
            />
            {showCalendarIcon && (
              <CalendarIcon
                className="absolute top-0 right-0 mx-3 mt-4"
                color="#5B34EA"
                size={20}
              />
            )}
          </div>
          {showDatePicker && (
            <div className="absolute" ref={datePickerRef}>
              <CustomDatePicker
                date={lineItemDate}
                dateFormat={dateFormat}
                handleChange={handleDatePicker}
                setVisibility={setShowDatePicker}
                wrapperRef={datePickerRef}
              />
            </div>
          )}
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
          <input
            className="focus:outline-none w-full rounded bg-transparent p-1 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Rate"
            type="text"
            value={rate}
            onChange={handleSetRate}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
          <input
            className="focus:outline-none w-full rounded bg-transparent p-1 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Quantity"
            type="text"
            value={quantity}
            onChange={handleSetQuantity}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
          {currencyFormat(clientCurrency, lineTotal)}
        </td>
        <td className="w-10">
          <button
            className="flex w-full items-center rounded p-2.5 text-center hover:bg-miru-gray-200"
            id="deleteLineItemButton"
            onClick={() => {
              handleDelete(item);
            }}
          >
            <DeleteIcon color="#5B34EA" size={16} weight="bold" />
          </button>
        </td>
      </tr>
      <tr>
        <td
          className="border-b-2 border-miru-gray-200 px-1 pb-4 text-left text-xs font-normal text-miru-dark-purple-400"
          colSpan={2}
        >
          <TextareaAutosize
            className="focus:outline-none w-full rounded bg-transparent p-1 text-sm font-medium text-miru-dark-purple-400 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Enter Description"
            // type="text"
            value={description}
            onChange={e => setDescription(e.target["value"])}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="border-b-2 border-miru-gray-200" colSpan={3} />
      </tr>
    </>
  );
};

export default NewLineItemStatic;
