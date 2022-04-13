import React, { useState, useRef } from "react";

const ManualEntry = ({ setShowItemInputs, setNewLineItems, newLineItems }) => {

  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<any>("");
  const [qty, setQty] = useState<string>("");
  const [lineTotal, setLineTotal] = useState<any>("");
  const ref = useRef();

  const onEnter = e => {
    if (e.key == "Enter") {
      const newItem = [...newLineItems, { name,date,description,rate,qty,lineTotal }];

      setNewLineItems(newItem);
      setName("");
      setDate("");
      setDescription("");
      setRate("");
      setQty("");
      setLineTotal("");
      setShowItemInputs(false);
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
        />
      </td>
      <td className="w-full">
        <input
          type="text"
          placeholder="Date"
          ref={ref}
          onFocus={(e) => (e.target.type = "date")}
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={date}
          onChange={e => setDate(e.target.value)}
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
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={rate}
          onChange={e => setRate(e.target.value)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Qty"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={qty}
          onChange={e => {setQty(e.target.value);
            setLineTotal(Number(rate)*Number(e.target.value));
          }}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="text-right font-normal text-base text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {lineTotal}
      </td>
    </tr>
  );
};

export default ManualEntry;
