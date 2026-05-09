import React, { useState, useEffect } from "react";

import { DatePicker } from "../../../ui/date-picker";
import dayjs from "dayjs";
import {
  currencyFormat,
  getLineItemDisplayName,
  lineTotalCalc,
  minFromHHMM,
  minToHHMM,
} from "helpers";
import { DeleteIcon } from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";
import { i18n } from "../../../../i18n";

const LineItemEditorRow = ({
  clientCurrency,
  item,
  handleDelete,
  setSelectedOption,
  dateFormat,
}) => {
  const strName = getLineItemDisplayName(item);
  const rowKey = item.id || item.timesheet_entry_id || strName;
  const [name, setName] = useState<string>(strName);
  const [lineItemDate, setLineItemDate] = useState<Date>(
    dayjs(item.date).isValid() ? dayjs(item.date).toDate() : new Date()
  );
  const [description, setDescription] = useState<string>(item.description);
  const [rate, setRate] = useState<number>(item.rate);
  const [quantity, setQuantity] = useState<any>(minToHHMM(item.quantity));
  const [lineTotal, setLineTotal] = useState<string>(
    item.lineTotal ?? item.amount ?? lineTotalCalc(item.quantity, item.rate)
  );

  useEffect(() => {
    const names = name.split(" ");
    const newItem = {
      ...item,
      first_name: names.splice(0, 1)[0],
      last_name: names.join(" "),
      name,
      date: dayjs(lineItemDate).format("YYYY-MM-DD"),
      description,
      rate,
      quantity: minFromHHMM(quantity),
      lineTotal,
    };

    const matchesItem = option => {
      const itemHasId = item.id !== undefined && item.id !== null;
      const itemHasTimesheetEntryId =
        item.timesheet_entry_id !== undefined &&
        item.timesheet_entry_id !== null;

      if (itemHasId) {
        return option.id === item.id;
      }

      if (itemHasTimesheetEntryId) {
        return option.timesheet_entry_id === item.timesheet_entry_id;
      }

      return option === item;
    };

    const updateSelectedOption = currentSelectedOption =>
      currentSelectedOption.map(option => {
        if (matchesItem(option)) {
          return newItem;
        }

        return option;
      });

    if (name) {
      setSelectedOption(updateSelectedOption);
    }
  }, [name, lineItemDate, description, quantity, rate, lineTotal]);

  const closeEditField = event => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  const handleSetRate = e => {
    const qtyInMin = Number(minFromHHMM(quantity));
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(qtyInMin, e.target.value));
  };

  const handleSetQuantity = e => {
    const qtyInMin = Number(minFromHHMM(e.target.value));
    setQuantity(e.target.value);
    setLineTotal(lineTotalCalc(qtyInMin, rate));
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setLineItemDate(selectedDate);
    }
  };

  return (
    <>
      <tr
        className="invoice-items-row cursor-pointer"
        data-line-item-row-key={rowKey}
        data-testid="invoice-line-item-row"
      >
        <td className="px-1 py-3 text-left text-base font-normal text-foreground ">
          <input
            className="focus:outline-none w-full rounded border border-transparent bg-transparent p-1 text-sm font-medium text-foreground focus:border-border focus:bg-background focus:ring-1 focus:ring-ring"
            data-testid="invoice-line-item-name"
            placeholder={name}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-foreground ">
          <DatePicker
            date={lineItemDate}
            onSelect={handleDateSelect}
            placeholder={i18n.t("invoices.selectDate")}
            displayFormat="MMM d, yyyy"
            className="h-9 w-full justify-start px-2 text-sm"
          />
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-foreground ">
          <input
            className="focus:outline-none w-full rounded border border-transparent bg-transparent p-1 text-right text-sm font-medium text-foreground focus:border-border focus:bg-background focus:ring-1 focus:ring-ring"
            data-testid="invoice-line-item-rate"
            placeholder={i18n.t("invoices.rate")}
            type="text"
            value={rate}
            onChange={handleSetRate}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-foreground ">
          <input
            className="focus:outline-none w-full rounded border border-transparent bg-transparent p-1 text-right text-sm font-medium text-foreground focus:border-border focus:bg-background focus:ring-1 focus:ring-ring"
            data-testid="invoice-line-item-quantity"
            placeholder={i18n.t("invoices.quantity")}
            type="text"
            value={quantity}
            onChange={handleSetQuantity}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="px-1 py-3 text-right text-base font-normal text-foreground ">
          {currencyFormat(clientCurrency, lineTotal)}
        </td>
        <td className="w-10">
          <button
            type="button"
            className="flex w-full items-center rounded p-2.5 text-center hover:bg-secondary"
            id="deleteLineItemButton"
            onClick={() => {
              handleDelete(item);
            }}
          >
            <DeleteIcon color="#5E58F1" size={16} weight="bold" />
          </button>
        </td>
      </tr>
      <tr>
        <td
          className="border-b-2 border-border px-1 pb-4 text-left text-xs font-normal text-muted-foreground"
          colSpan={2}
        >
          <TextareaAutosize
            className="focus:outline-none w-full rounded border border-transparent bg-transparent p-1 text-sm font-medium text-muted-foreground focus:border-border focus:bg-background focus:ring-1 focus:ring-ring"
            data-testid="invoice-line-item-description"
            placeholder={i18n.t("invoices.enterDescription")}
            value={description}
            onChange={e => setDescription(e.target["value"])}
            onKeyDown={closeEditField}
          />
        </td>
        <td className="border-b-2 border-border" colSpan={3} />
      </tr>
    </>
  );
};

export default LineItemEditorRow;
