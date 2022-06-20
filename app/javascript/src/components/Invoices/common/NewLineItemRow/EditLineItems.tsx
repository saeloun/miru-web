import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption
}) => {

  const strName = item.name || `${item.first_name} ${item.last_name}`;
  const quantity = (item.qty / 60) || (item.quantity / 60);
  const [name, setName] = useState<string>(strName);
  const newDate = Date.parse(item.date);
  const [lineItemDate, setLineItemDate] = useState(newDate);
  const [description, setDescription] = useState<string>(item.description);
  const rate = item.rate;
  const lineTotal = (quantity / 60) * item.rate;

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
      if (option.id === item.id) {
        return newItem;
      }

      return option;
    });

    setSelectedOption(selectedOptionArr);
  }, [name, lineItemDate, description]);

  return (
    <tr className="w-full my-1">
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Name"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </td>
      <td className="w-full">
        <DatePicker
          wrapperClassName="datePicker invoice-datepicker"
          calendarClassName="miru-calendar invoice-datepicker-option"
          dateFormat="dd.MM.yyyy"
          selected={lineItemDate}
          onChange={(date) => setLineItemDate(date)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={description}
          onChange={e => setDescription(e.target.value)}
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
    </tr>
  );
};

export default EditLineItems;
