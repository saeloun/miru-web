import React, { FC } from "react";

import {
  CurrencyCircleDollarIcon,
  WaiveSVG,
  DeleteIcon,
  ClockIcon,
  DownloadSimpleIcon,
  ReminderIcon,
} from "miruIcons";
import { i18n } from "../../../i18n";

const MoreOptions: FC<MoreOptionsProps> = ({
  deleteInvoice,
  wavieInvoice,
  downloadInvoice,
  showHistory,
  invoice = null,
  markInvoiceAsPaid,
  setIsSendReminder,
  sendInvoice,
  setIsMoreOptionsVisible,
}) => (
  <ul className="absolute right-20 z-10 rounded border-2 border-border bg-white py-2 drop-shadow">
    {downloadInvoice != null && invoice.status != "draft" && (
      <li
        className="flex cursor-pointer items-center py-2.5 px-4 text-primary hover:bg-muted"
        onClick={() => downloadInvoice(invoice)}
      >
        <DownloadSimpleIcon className="mr-4" size={16} weight="bold" />
        {i18n.t("download")}
      </li>
    )}
    <li
      className="flex cursor-pointer items-center py-2.5 px-4 text-primary hover:bg-muted"
      id="viewHistory"
      onClick={showHistory}
    >
      <ClockIcon className="mr-4" size={16} weight="bold" />
      {i18n.t("invoices.viewHistory")}
    </li>
    {["sent", "overdue", "viewed"].includes(invoice?.status) && (
      <>
        <li
          className="flex cursor-pointer items-center py-2 px-4 text-primary hover:bg-muted"
          onClick={() => markInvoiceAsPaid(invoice.id)}
        >
          <CurrencyCircleDollarIcon className="mr-4" size={16} weight="bold" />
          {i18n.t("invoices.markAsPaid")}
        </li>
        <li
          className="flex cursor-pointer items-center py-2 px-4 text-primary hover:bg-muted"
          onClick={wavieInvoice}
        >
          <img className="mr-4" height="16px" src={WaiveSVG} width="16px" />
          {i18n.t("invoices.waiveOff")}
        </li>
      </>
    )}
    {invoice?.status === "overdue" && (
      <li
        id="invoiceReminderAction"
        data-testid="invoice-reminder-action"
        className="flex cursor-pointer items-center py-2 px-4 text-primary hover:bg-muted"
        onClick={() => {
          setIsSendReminder(true);
          sendInvoice();
          setIsMoreOptionsVisible(false);
        }}
      >
        <ReminderIcon className="mr-4" id="reminderIcon" size={16} />
        {i18n.t("invoices.sendReminder")}
      </li>
    )}
    <li
      className="flex cursor-pointer items-center py-2 px-4 text-destructive hover:bg-muted"
      onClick={deleteInvoice}
    >
      <DeleteIcon className="mr-4" size={16} weight="bold" />
      {i18n.t("delete")}
    </li>
  </ul>
);

interface MoreOptionsProps {
  deleteInvoice: () => void;
  wavieInvoice: () => void;
  downloadInvoice: (invoice: any) => void;
  invoice: any;
  markInvoiceAsPaid: (id: number) => void;
  showHistory: () => void;
  setIsSendReminder: (value: boolean) => void;
  sendInvoice?: () => void;
  setIsMoreOptionsVisible?: (value: boolean) => void;
}

export default MoreOptions;
