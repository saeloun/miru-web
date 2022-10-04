import React, { useState, useEffect } from "react";

import { minFromHHMM, minToHHMM, lineTotalCalc } from "helpers";
import { Trash } from "phosphor-react";
import DatePicker from "react-datepicker";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption,
  handleDelete,
  setEdit
}) => {
  const strName = item.name || `${item.first_name} ${item.last_name}`;
  const [name, setName] = useState<string>(strName);
  const formatedDate = new Date(item.date);
  const [lineItemDate, setLineItemDate] = useState(formatedDate);
  const [description, setDescription] = useState<string>(item.description);
  const [rate, setRate] = useState<number>(item.rate);
  const [quantity, setQuantity] = useState<any>(minToHHMM(item.quantity));
  const [lineTotal, setLineTotal] = useState<string>(item.lineTotal);

  useEffect(() => {
    const names = name.split(" ");
    const newItem = {
      ...item,
      first_name: names.splice(0, 1)[0],
      last_name: names.join(" "),
      name: name,
      date: lineItemDate,
      description,
      rate,
      quantity: minFromHHMM(quantity),
      lineTotal
    };

    const selectedOptionArr = selectedOption.map((option) => {
      if ((option.id && option.id === item.id) ||
        (option.timesheet_entry_id && option.timesheet_entry_id === item.timesheet_entry_id)) {
        return newItem;
      }

      return option;
    });

    setSelectedOption(selectedOptionArr);
  }, [name, lineItemDate, description, quantity, rate, lineTotal]);

  const closeEditField = (event) => {
    if (event.key === "Enter") setEdit(false);
  };

  const handleSetRate = (e) => {
    const qtyInMin = Number(minFromHHMM(quantity));
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(qtyInMin, e.target.value));
  };

  const handleSetQuantity = (e) => {
    const qtyInMin = Number(minFromHHMM(e.target.value));
    setQuantity(e.target.value);
    setLineTotal(lineTotalCalc(qtyInMin, rate));
  };

  return (
    <tr className="w-full my-1">
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Name"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={closeEditField}
        />
      </td>
      <td className="w-full">
        <DatePicker
          wrapperClassName="datePicker invoice-datepicker"
          calendarClassName="miru-calendar invoice-datepicker-option"
          dateFormat="dd.MM.yyyy"
          selected={lineItemDate}
          onChange={(date) => setLineItemDate(date)}
          onKeyDown={closeEditField}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={closeEditField}
        />
      </td>
      <td className=" w-full">
        <input
          type="text"
          placeholder="Rate"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={rate}
          onChange={handleSetRate}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Quantity"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={quantity}
          onChange={handleSetQuantity}
        />
      </td>
      <td className="text-right font-normal text-base text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {lineTotal}
      </td>
      <td>
        <button onClick={() => handleDelete(item)} className="w-full flex items-center px-2.5 text-left py-4 hover:bg-miru-gray-100">
          <Trash size={16} color="#E04646" weight="bold" />
        </button>
      </td>
    </tr>
  );
};

export default EditLineItems;
