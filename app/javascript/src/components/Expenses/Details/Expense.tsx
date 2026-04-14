import React from "react";

import { currencyFormat } from "helpers";
import { i18n } from "../../../i18n";

import ReceiptPreview from "../ReceiptPreview";

const Expense = ({ expense, currency }) => (
  <div className="mt-8 flex flex-col px-4 lg:px-0">
    <div className="flex flex-col">
      <span className="text-xs font-medium text-foreground">
        {i18n.t("amount")}
      </span>
      <span className="text-2xl font-normal tracking-tight text-foreground">
        {currencyFormat(currency, expense?.amount)}
      </span>
    </div>
    <div className="my-10 flex w-full flex-wrap items-center justify-between gap-y-10">
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">
          {i18n.t("date")}
        </span>
        <span className="text-base font-medium text-foreground">
          {expense?.date || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">
          {i18n.t("expenses.vendor")}
        </span>
        <span className="text-base font-medium text-foreground">
          {expense?.vendorName || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">
          {i18n.t("type")}
        </span>
        <span className="text-base font-medium text-foreground">
          {expense?.type || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">
          {i18n.t("expenses.receipts")}
        </span>
        <div className="flex flex-col text-base font-medium text-foreground">
          {expense?.receipts.length > 0
            ? i18n.t("expenses.receiptsAttached", {
                count: expense.receipts.length,
              })
            : "-"}
        </div>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-medium text-foreground">
        {i18n.t("description")}
      </span>
      <span className="text-base font-medium text-foreground">
        {expense?.description || "-"}
      </span>
    </div>
    <div className="mt-8">
      <span className="text-xs font-medium text-foreground">
        {i18n.t("expenses.preview")}
      </span>
      <div className="mt-3">
        <ReceiptPreview receipts={expense?.receipts || []} />
      </div>
    </div>
  </div>
);

export default Expense;
