import React, { useState, useEffect, useRef } from "react";

import { Trash } from "phosphor-react";

const ManualEntry = ({
  entry,
  manualEntryArr,
  setManualEntryArr
}) => {

  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<any>("");
  const [qty, setQty] = useState<any>("");
  const [lineTotal, setLineTotal] = useState<any>(entry.lineTotal ? entry.lineTotal : 0);
  const [lineItem, setLineItem] = useState<any>({});
  const ref = useRef();

  useEffect(() => {
    setQty(entry.qty ? (entry.qty / 60) : 0);
  }, [entry]);

  useEffect(() => {
    if (entry.idx) {
      setLineItem({ ...lineItem,
        idx: entry.idx,
        name,
        date,
        description,
        rate,
        qty: (Number(qty) * 60),
        lineTotal: (Number(qty) * Number(rate))
      });
    }
  }, [name, date, description, rate, qty, lineTotal]);

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

  return (
    <tr className="w-full my-1">
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Name"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          defaultValue={entry.name}
          value={entry.name}
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
          defaultValue={entry.date}
          value={entry.date}
          onChange={e => setDate(e.target.value)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          defaultValue={entry.description}
          value={entry.description}
          onChange={e => setDescription(e.target.value)}
        />
      </td>
      <td className=" w-full">
        <input
          type="text"
          placeholder="Rate"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          defaultValue={entry.rate}
          value={entry.rate}
          onChange={e => {
            setRate(e.target.value);
            setLineTotal(Number(e.target.value) * Number(qty));
          }}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Qty"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          defaultValue={entry.qty}
          value={qty}
          onChange={e => {
            setQty(e.target.value);
            setLineTotal(Number(rate) * Number(e.target.value));
          }}
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
