import React, { useState, useEffect, useRef } from "react";

import {
  minFromHHMM,
  minToHHMM,
  lineTotalCalc,
  useOutsideClick,
} from "helpers";
import { DeleteIcon } from "miruIcons";
import DatePicker from "react-datepicker";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption,
  handleDelete,
  setIsEdit,
}) => {
  const strName = item.name || `${item.first_name} ${item.last_name}`;
  const [name, setName] = useState<string>(strName);
  const formatedDate = new Date(item.date);
  const [lineItemDate, setLineItemDate] = useState(formatedDate);
  const [description, setDescription] = useState<string>(item.description);
  const [rate, setRate] = useState<number>(item.rate);
  const [quantity, setQuantity] = useState<any>(minToHHMM(item.quantity));
  const [lineTotal, setLineTotal] = useState<string>(item.lineTotal);
  const wrapperRef = useRef(null);

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

    setSelectedOption(selectedOptionArr);
  }, [name, lineItemDate, description, quantity, rate, lineTotal]);

  useOutsideClick(wrapperRef, () => {
    setIsEdit(false);
  });

  const closeEditField = event => {
    if (event.key === "Enter") setIsEdit(false);
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

  return (
    <tr className="my-1 w-full" ref={wrapperRef}>
      <td className="w-full p-1">
        <input
          className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          placeholder="Name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={closeEditField}
        />
      </td>
      <td className="w-full">
        <DatePicker
          calendarClassName="miru-CalendarIcon invoice-datepicker-option"
          dateFormat="dd.MM.yyyy"
          selected={lineItemDate}
          wrapperClassName="datePicker invoice-datepicker"
          onChange={date => setLineItemDate(date)}
          onKeyDown={closeEditField}
        />
      </td>
      <td className="w-full p-1">
        <input
          className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          placeholder="Description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={closeEditField}
        />
      </td>
      <td className=" w-full">
        <input
          className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          placeholder="Rate"
          type="text"
          value={rate}
          onChange={handleSetRate}
        />
      </td>
      <td className="w-full p-1">
        <input
          className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          placeholder="Quantity"
          type="text"
          value={quantity}
          onChange={handleSetQuantity}
        />
      </td>
      <td className="focus:outline-none text-right text-base font-normal text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {lineTotal}
      </td>
      <td>
        <button
          className="flex w-full items-center px-2.5 py-4 text-left hover:bg-miru-gray-100"
          onClick={() => handleDelete(item)}
        >
          <DeleteIcon color="#E04646" size={16} weight="bold" />
        </button>
      </td>
    </tr>
  );
};

export default EditLineItems;
