import React, { useState, useRef } from "react";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption,
  setEdit
}) => {

  const strName = item.name || `${item.first_name} ${item.last_name}`;
  const quantity = (item.qty / 60) || (item.quantity / 60);
  const [name, setName] = useState<string>(strName);
  const [lineItemDate, setLineItemDate] = useState<string>(item.date);
  const [description, setDescription] = useState<string>(item.description);
  const [rate, setRate] = useState<any>(item.rate);
  const [qty, setQty] = useState<any>(quantity);
  const [lineTotal, setLineTotal] = useState<any>((item.qty / 60) * item.rate);
  const ref = useRef();

  const onEnter = e => {
    if (e.key == "Enter") {
      const sanitizedSelected = selectedOption.filter(option =>
        option.id !== item.id || option.timesheet_entry_id !== item.timesheet_entry_id
      );

      const names = name.split(" ");
      const newItem = {
        ...item,
        first_name: names.splice(0, 1)[0],
        last_name: names.join(" "),
        name: name,
        date: lineItemDate,
        description,
        rate,
        qty: Number(qty) * 60,
        lineTotal: Number(qty) * Number(rate)
      };
      setSelectedOption([...sanitizedSelected, { ...newItem }]);
      setEdit(false);
    }
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
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="w-full">
        <input
          type="text"
          placeholder="Date"
          ref={ref}
          pattern="\d{1,2}-\d{1,2}-\d{4}"
          onFocus={(e) => (e.target.type = "date")}
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={lineItemDate}
          onChange={e => setLineItemDate(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className=" w-full">
        <input
          type="text"
          placeholder="Rate"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={rate}
          onChange={e => setRate(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Qty"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={qty}
          onChange={e => {
            setQty(e.target.value);
            setLineTotal(Number(rate) * Number(e.target.value));
          }}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="text-right font-normal text-base text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {lineTotal.toFixed(2)}
      </td>
    </tr>
  );
};

export default EditLineItems;
