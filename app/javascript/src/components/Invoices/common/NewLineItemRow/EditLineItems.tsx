import React, { useState, useEffect } from "react";

import DatePicker from "react-datepicker";
import { Trash } from "phosphor-react";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption,
  handleDelete,
  setEdit
}) => {

  const strName = item.name || `${item.first_name} ${item.last_name}`;
  const quantity = (item.qty / 60) || (item.quantity / 60);
  const [name, setName] = useState<string>(strName);
  const formatedDate = new Date(item.date);
  const [lineItemDate, setLineItemDate] = useState(formatedDate);
  const [description, setDescription] = useState<string>(item.description);
  const rate = item.rate;
  const lineTotal = quantity * item.rate;

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
      qty: Number(quantity) * 60,
      lineTotal: Number(quantity) * Number(rate)
    };

    const selectedOptionArr = selectedOption.map((option) => {
      if ((option.id && option.id === item.id) ||
        (option.timesheet_entry_id && option.timesheet_entry_id === item.timesheet_entry_id)) {
        return newItem;
      }

      return option;
    });

    setSelectedOption(selectedOptionArr);
  }, [name, lineItemDate, description]);

  const closeEditField = (event) => {
    if (event.key === "Enter") setEdit(false);
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
          className=" p-1 px-2 bg-miru-gray-600 rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={item.rate}
          disabled={true}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Qty"
          className=" p-1 px-2 bg-miru-gray-600 rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={quantity}
          disabled={true}
        />
      </td>
      <td className="text-right font-normal text-base text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {lineTotal.toFixed(2)}
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
