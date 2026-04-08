import React, { useState, useEffect, useRef } from "react";

import { DatePicker } from "../../../ui/date-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../../../ui/tooltip";
import dayjs from "dayjs";
import {
  lineTotalCalc,
  minFromHHMM,
  minToHHMM,
  useOutsideClick,
} from "helpers";
import { DeleteIcon } from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";
import { i18n } from "../../../../i18n";

const ManualEntry = ({
  addNew,
  getNewLineItemDropdown,
  lineItem,
  setLineItem,
  manualEntryArr,
  setManualEntryArr,
  setNewLineItemTable,
  setAddNew,
  showNewLineItemTable,
  dateFormat,
}) => {
  const [name, setName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<any>(0);
  const [lineTotal, setLineTotal] = useState<string>("0");
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(minToHHMM(quantity));
  const [isEnter, setIsEnter] = useState<boolean>(false);
  const wrapperRef = useRef(null);
  const draftIdRef = useRef(
    `draft-${globalThis.crypto?.randomUUID?.() || `${Date.now()}`}`
  );

  useEffect(() => {
    setLineItem({
      ...lineItem,
      id: draftIdRef.current,
      name,
      date: dayjs(selectedDate).format("YYYY-MM-DD"),
      description,
      rate,
      quantity,
      lineTotal,
    });
  }, [name, selectedDate, description, rate, quantity, lineTotal]);

  useEffect(() => {
    if (isEnter) {
      setIsEnter(false);
      setAddNew(false);
    }
  }, [isEnter]);

  const handleDelete = async () => {
    const tempManualEntryArr = [...manualEntryArr];

    const indexOfItem = tempManualEntryArr.findIndex(
      object => object.id === draftIdRef.current
    );
    if (indexOfItem !== -1) {
      tempManualEntryArr.splice(indexOfItem, 1);
    }
    await setManualEntryArr(tempManualEntryArr);
    setAddNew(false);
  };

  const handleEnter = event => {
    if (event.key == "Enter") {
      setIsEnter(true);
    }
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

  useOutsideClick(
    wrapperRef,
    () => {
      setNewLineItemTable(false);
    },
    addNew
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <TooltipProvider>
      <>
        <tr className="border-b border-gray-100 hover:bg-gray-50">
          <td className="px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  data-testid="invoice-manual-entry-name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={i18n.t("invoices.enterName")}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onClick={() => setNewLineItemTable(true)}
                  onKeyDown={handleEnter}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{i18n.t("invoices.enterNameTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <DatePicker
                    date={selectedDate}
                    onSelect={handleDateSelect}
                    placeholder={i18n.t("invoices.selectDate")}
                    className="w-full text-sm"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Select the date for this entry:{" "}
                  {dayjs(selectedDate).format(dateFormat)}
                </p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  data-testid="invoice-manual-entry-rate"
                  className="w-full px-3 py-2 text-sm text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  type="number"
                  value={rate}
                  onChange={handleSetRate}
                  onKeyDown={handleEnter}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Hourly rate: ${rate}/hour</p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  data-testid="invoice-manual-entry-quantity"
                  className="w-full px-3 py-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="00:00"
                  type="text"
                  value={qtyInHHrMin}
                  onChange={handleSetQuantity}
                  onKeyDown={handleEnter}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Time worked: {qtyInHHrMin} ({quantity} minutes)
                </p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">${lineTotal}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Line total: {qtyInHHrMin} × ${rate} = ${lineTotal}
                </p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid="invoice-manual-entry-delete"
                  className="p-1 rounded hover:bg-red-50 transition-colors"
                  onClick={handleDelete}
                >
                  <DeleteIcon color="#E04646" size={18} weight="bold" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{i18n.t("invoices.deleteLineItem")}</p>
              </TooltipContent>
            </Tooltip>
          </td>
        </tr>
        {showNewLineItemTable && (
          <tr>
            <td className="relative w-full" colSpan={5}>
              <div
                className="box-shadow absolute z-40 m-0 w-full rounded bg-white text-sm font-medium text-foreground"
                ref={wrapperRef}
              >
                {getNewLineItemDropdown()}
              </div>
            </td>
          </tr>
        )}
        <tr>
          <td className="w-full p-1" colSpan={2}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TextareaAutosize
                  data-testid="invoice-manual-entry-description"
                  className="focus:outline-none w-full rounded bg-white p-1 px-2 text-sm font-medium text-foreground focus:border-border focus:ring-1 focus:ring-ring"
                  placeholder={i18n.t("invoices.enterDescription")}
                  value={description}
                  onChange={e => setDescription(e.target["value"])}
                  onKeyDown={handleEnter}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{i18n.t("invoices.descriptionTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td colSpan={3} />
        </tr>
      </>
    </TooltipProvider>
  );
};

export default ManualEntry;
