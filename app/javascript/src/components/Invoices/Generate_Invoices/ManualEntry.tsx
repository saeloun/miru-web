import * as React from "react";

const ManualEntry = ({ setShowItemInputs,setNewLineItems,NewLineItems }) => {

  const [Name, setName] = React.useState<string>("");
  const [Date, setDate] = React.useState<string>("");
  const [Description, setDescription] = React.useState<string>("");
  const [Rate, setRate] = React.useState<string>("");
  const [Qty, setQty] = React.useState<string>("");
  const [LineTotal, setLineTotal] = React.useState<string>("");
  const ref =React.useRef();

  const onEnter = val => {
    if (val.key == "Enter") {
      const newItem = [...NewLineItems];
      newItem.push({
        Name: Name,
        Date: Date,
        Description: Description,
        Rate: Rate,
        Qty: Qty,
        LineTotal: LineTotal
      });

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
      <td className="p-1  w-full">
        <input
          type="text"
          placeholder="Name"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 "
          value={Name}
          onChange={val => setName(val.target.value)}
        />
      </td>
      <td className=" w-full">
        <input
          type="text"
          placeholder="Something"
          ref={ref}
          onFocus={(e)=>(e.target.type="date")}
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
          value={Date}
          onChange={val => setDate(val.target.value)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
          value={Description}
          onChange={val => setDescription(val.target.value)}
        />
      </td>
      <td className=" w-full">
        <input
          type="text"
          placeholder="Rate"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
          value={Rate}
          onChange={val => setRate(val.target.value)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Qty"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
          value={Qty}
          onChange={val => setQty(val.target.value)}
          onKeyDown={val => onEnter(val)}
        />
      </td>
      <td className="text-right font-normal text-base text-miru-dark-purple-1000">
        $90
      </td>
    </tr>
  );
};

export default ManualEntry;
