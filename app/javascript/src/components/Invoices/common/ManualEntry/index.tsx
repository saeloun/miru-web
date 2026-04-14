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
  currencyFormat,
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
  clientCurrency,
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
          <td className="px-1 py-3 text-left text-base font-normal text-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  data-testid="invoice-manual-entry-name"
                  className="focus:outline-none w-full rounded bg-transparent p-1 text-sm font-medium text-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
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
          <td className="px-1 py-3 text-right text-base font-normal text-foreground">
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
          <td className="px-1 py-3 text-right text-base font-normal text-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  data-testid="invoice-manual-entry-rate"
                  className="focus:outline-none w-full rounded bg-transparent p-1 text-right text-sm font-medium text-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
                  placeholder="0.00"
                  type="number"
                  value={rate}
                  onChange={handleSetRate}
                  onKeyDown={handleEnter}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Hourly rate: {currencyFormat(clientCurrency, rate)}/hour</p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="px-1 py-3 text-right text-base font-normal text-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  data-testid="invoice-manual-entry-quantity"
                  className="focus:outline-none w-full rounded bg-transparent p-1 text-right text-sm font-medium text-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
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
          <td className="px-1 py-3 text-right text-base font-normal text-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  {currencyFormat(clientCurrency, lineTotal)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Line total: {qtyInHHrMin} ×{" "}
                  {currencyFormat(clientCurrency, rate)} ={" "}
                  {currencyFormat(clientCurrency, lineTotal)}
                </p>
              </TooltipContent>
            </Tooltip>
          </td>
          <td className="w-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-testid="invoice-manual-entry-delete"
                  className="flex w-full items-center rounded p-2.5 text-center hover:bg-secondary"
                  onClick={handleDelete}
                >
                  <DeleteIcon color="#5E58F1" size={16} weight="bold" />
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
          <td
            className="border-b-2 border-border px-1 pb-4 text-left text-xs font-normal text-muted-foreground"
            colSpan={2}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <TextareaAutosize
                  data-testid="invoice-manual-entry-description"
                  className="focus:outline-none w-full rounded bg-transparent p-1 text-sm font-medium text-muted-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
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
          <td className="border-b-2 border-border" colSpan={3} />
        </tr>
      </>
    </TooltipProvider>
  );
};

export default ManualEntry;
