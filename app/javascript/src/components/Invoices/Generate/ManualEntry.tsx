import React, { useState, useEffect, useRef } from "react";

import { Trash } from "phosphor-react";

import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";

const ManualEntry = ({
  entry,
  manualEntryArr,
  setManualEntryArr
}) => {
  const [name, setName] = useState<string>(entry.name || "");
  const [date, setDate] = useState<string>(entry.date || "");
  const [description, setDescription] = useState<string>(entry.description || "");
  const [rate, setRate] = useState<number>(entry.rate || 0);
  const [quantity, setQuantity] = useState<any>(entry.quantity || 0);
  const [lineTotal, setLineTotal] = useState<string>(entry.lineTotal || 0);
  const [lineItem, setLineItem] = useState<any>({});
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(minutesToHHMM(quantity));
  const ref = useRef();

  useEffect(() => {
    if (entry.idx) {
      setLineItem({ ...lineItem,
        idx: entry.idx,
        name,
        date,
        description,
        rate,
        quantity,
        lineTotal
      });
    }
  }, [name, date, description, rate, quantity, lineTotal]);

  useEffect(() => {
    const newManualEntryArr = manualEntryArr.map((option) => {
      if (option.idx === lineItem.idx) {
        return lineItem;
      }

      return option;
    });

    setManualEntryArr(newManualEntryArr);
  }, [lineItem]);

  const handleDelete = async () => {
    const tempManualEntryArr = [...manualEntryArr];

    const indexOfItem = tempManualEntryArr.findIndex(object => object.idx === entry.idx);
    indexOfItem !== -1 && tempManualEntryArr.splice(indexOfItem, 1);

    await setManualEntryArr(tempManualEntryArr);
  };

  const handleSetRate = (e) => {
    setRate(e.target.value);
    setLineTotal((Number(quantity / 60) * Number(e.target.value)).toFixed(2));
  };

  const handleSetQuantity = (e) => {
    const quantityInMin = Number(minutesFromHHMM(e.target.value));
    setQtyInHHrMin(e.target.value);
    setQuantity(quantityInMin);
    setLineTotal((Number(quantityInMin / 60) * Number(rate)).toFixed(2));
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
          onChange={handleSetRate}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="quantity"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={qtyInHHrMin}
          onChange={handleSetQuantity}
        />
      </td>
      <td className="text-right font-normal text-base text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
        {entry.lineTotal}
      </td>
      <td>
        <button onClick={handleDelete} className="w-full flex items-center px-2.5 text-left py-4 hover:bg-miru-gray-100">
          <Trash size={16} color="#E04646" weight="bold" />
        </button>
      </td>
    </tr>
  );
};

export default ManualEntry;
