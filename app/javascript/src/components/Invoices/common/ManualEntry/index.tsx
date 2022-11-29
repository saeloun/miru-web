import React, { useState, useEffect, useRef } from "react";

import { lineTotalCalc, minFromHHMM, minToHHMM, useOutsideClick } from "helpers";
import { DeleteIcon } from "miruIcons";
import TextareaAutosize from "react-autosize-textarea";

const ManualEntry = ({
  manualEntryArr,
  setManualEntryArr,
  setNewLineItemTable,
  getNewLineItemDropdown,
  addNew,
  setAddNew,
  showNewLineItemTable,
  lineItems,
  setFilteredLineItems,
  filteredLineItems
}) => {
  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<any>(0);
  const [lineTotal, setLineTotal] = useState<string>("-");
  const [lineItem, setLineItem] = useState<any>({});
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(minToHHMM(quantity));
  const [isEnter, setEnter] =useState<boolean>(false);
  const ref = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setLineItem({ ...lineItem,
      idx: manualEntryArr.length + 1,
      name,
      date,
      description,
      rate,
      quantity,
      lineTotal
    });

  }, [name, date, description, rate, quantity, lineTotal]);

  useEffect( () => {
    if (name && filteredLineItems.length > 0){
      const newLineItems = filteredLineItems.filter((item) => item.first_name.toLowerCase().includes(name.toLowerCase()));
      newLineItems ? setFilteredLineItems(newLineItems) : setFilteredLineItems([]);
    }
    else {
      setFilteredLineItems(lineItems);
    }
  },[name]);

  useEffect(() => {
    if (isEnter){
      setManualEntryArr([...manualEntryArr,lineItem]);
      setEnter(false);
      setAddNew(false);
    }
  }, [isEnter]);

  const handleDelete = async () => {
    const tempManualEntryArr = [...manualEntryArr];

    const indexOfItem = tempManualEntryArr.findIndex(object => object.idx === manualEntryArr.length + 1);
    indexOfItem !== -1 && tempManualEntryArr.splice(indexOfItem, 1);
    await setManualEntryArr(tempManualEntryArr);
    setAddNew(false);
  };

  const handleEnter = (event)=>{
    if (event.key == "Enter"){
      setEnter(true);
    }
  };

  const handleSetRate = (e) => {
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(quantity, e.target.value));
  };

  const handleSetQuantity = (e) => {
    const quantityInMin = Number(minFromHHMM(e.target.value));
    setQtyInHHrMin(e.target.value);
    setQuantity(quantityInMin);
    setLineTotal(lineTotalCalc(quantityInMin, rate));
  };

  useOutsideClick(wrapperRef, () => {
    setNewLineItemTable(false);
  }, addNew);

  return (
    <>
      <tr className="w-full my-1">
        <td className="p-1 w-full">
          <input
            type="text"
            placeholder="Name"
            className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            value={name}
            onChange={e => setName(e.target.value)}
            onClick={()=>setNewLineItemTable(true)}
            onKeyDown={handleEnter}
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
            onKeyDown={handleEnter}
          />
        </td>
        <td className=" w-full">
          <input
            type="text"
            placeholder="Rate"
            className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            value={rate}
            onChange={handleSetRate}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="p-1 w-full">
          <input
            type="text"
            placeholder="quantity"
            className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            value={qtyInHHrMin}
            onChange={handleSetQuantity}
            onKeyDown={handleEnter}
          />
        </td>
        <td className="text-right font-normal text-base text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000">
          {lineTotal}
        </td>
        <td>
          <button onClick={handleDelete} className="w-full flex items-center px-2.5 text-left py-4 hover:bg-miru-gray-100">
            <DeleteIcon size={16} color="#E04646" weight="bold" />
          </button>
        </td>
      </tr>
      { showNewLineItemTable &&
      <tr>
        <td className="w-full relative" colSpan={5}>
          {<div ref={wrapperRef} className="box-shadow rounded absolute m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white w-full">
            {getNewLineItemDropdown()}
          </div>}
        </td>
      </tr>
      }
      <tr>
        <td className="p-1 w-full" colSpan={2}>
          <TextareaAutosize
            value={description}
            onChange={e => setDescription(e.target["value"])}
            onKeyDown={handleEnter}
            placeholder="Description"
            className="p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          />
        </td>
        <td colSpan={3}></td>
      </tr>
    </>
  );
};

export default ManualEntry;
