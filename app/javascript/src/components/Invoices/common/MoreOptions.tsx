/* eslint-disable no-unused-vars */
import React, { FC } from "react";

import { CurrencyCircleDollarIcon, ReminderIcon, WaiveSVG } from "miruIcons";
import { Trash, DownloadSimple } from "phosphor-react";

const MoreOptions: FC<MoreOptionsProps> = ({
  deleteInvoice,
  wavieInvoice,
  downloadInvoice,
  invoice = null,
  markInvoiceAsPaid = () => null,
  setIsSendReminder,
  sendInvoice,
}) => (
  <ul className="absolute right-20 rounded border-2 border-miru-gray-200 bg-white py-2 drop-shadow">
    {downloadInvoice != null && invoice.status != "draft" && (
      <li
        className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
        onClick={() => downloadInvoice(invoice)}
      >
        <DownloadSimple className="mr-4" size={16} />
        Download
      </li>
    )}
    {["sent", "overdue", "viewed"].includes(invoice?.status) && (
      <>
        <li
          className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
          onClick={() => markInvoiceAsPaid(invoice.id)}
        >
          <CurrencyCircleDollarIcon className="mr-4" size={16} />
          Mark as Paid
        </li>
        <li
          className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
          onClick={wavieInvoice}
        >
          <img className="mr-4" height="16px" src={WaiveSVG} width="16px" />
          Waive Off
        </li>
      </>
    )}
    {invoice?.status === "overdue" && (
      <li
        className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
        onClick={() => {
          setIsSendReminder(true);
          sendInvoice();
        }}
      >
        <ReminderIcon className="mr-4" size={16} />
        Send Reminder
      </li>
    )}
    <li
      className="flex cursor-pointer items-center py-2.5 px-4 text-miru-red-400 hover:bg-miru-gray-100"
      onClick={deleteInvoice}
    >
      <Trash className="mr-4" size={16} />
      Delete
    </li>
  </ul>
);

interface MoreOptionsProps {
  deleteInvoice: () => void;
  wavieInvoice: () => void;
  downloadInvoice: (invoice: any) => void;
  invoice: any;
  markInvoiceAsPaid: (id: number) => void;
  setIsSendReminder: (value: boolean) => void;
  sendInvoice?: () => void;
}

export default MoreOptions;
