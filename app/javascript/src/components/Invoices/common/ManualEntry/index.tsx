import React, { useState, useEffect, useRef } from "react";

import { lineTotalCalc, minFromHHMM, minToHHMM } from "helpers";
import { DeleteIcon } from "miruIcons";

const ManualEntry = ({ entry, manualEntryArr, setManualEntryArr }) => {
  const [name, setName] = useState<string>(entry.name || "");
  const [date, setDate] = useState<string>(entry.date || "");
  const [description, setDescription] = useState<string>(
    entry.description || ""
  );
  const [rate, setRate] = useState<number>(entry.rate || 0);
  const [quantity, setQuantity] = useState<any>(entry.quantity || 0);
  const [lineTotal, setLineTotal] = useState<string>(entry.lineTotal || 0);
  const [lineItem, setLineItem] = useState<any>({});
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(minToHHMM(quantity));
  const ref = useRef();

  useEffect(() => {
    if (entry.idx) {
      setLineItem({
        ...lineItem,
        idx: entry.idx,
        name,
        date,
        description,
        rate,
        quantity,
        lineTotal,
      });
    }
  }, [name, date, description, rate, quantity, lineTotal]);

  useEffect(() => {
    const newManualEntryArr = manualEntryArr.map(option => {
      if (option.idx === lineItem.idx) {
        return lineItem;
      }

      return option;
    });

    setManualEntryArr(newManualEntryArr);
  }, [lineItem]);

  const handleDelete = async () => {
    const tempManualEntryArr = [...manualEntryArr];

    const indexOfItem = tempManualEntryArr.findIndex(
      object => object.idx === entry.idx
    );
    indexOfItem !== -1 && tempManualEntryArr.splice(indexOfItem, 1);

    await setManualEntryArr(tempManualEntryArr);
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

  return (
    <tr className="my-1 w-full">
      <td className="w-full p-1">
        <input
          className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          placeholder="Name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
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
        />
      </td>
      <td className="w-full p-1">
        <input
          className=" focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          placeholder="Description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
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
          placeholder="quantity"
          type="text"
          value={qtyInHHrMin}
          onChange={handleSetQuantity}
        />
      </td>
      <td className="focus:outline-none text-right text-base font-normal text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {entry.lineTotal}
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
  );
};

export default ManualEntry;
