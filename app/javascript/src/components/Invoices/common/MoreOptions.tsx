import React, { FC } from "react";

import {
  CurrencyCircleDollarIcon,
  WaiveSVG,
  DeleteIcon,
  ClockIcon,
  DownloadSimpleIcon,
  ReminderIcon,
} from "miruIcons";

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
  <ul className="absolute right-20 z-10 rounded border-2 border-miru-gray-200 bg-white py-2 drop-shadow">
    {downloadInvoice != null && invoice.status != "draft" && (
      <li
        className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
        onClick={() => downloadInvoice(invoice)}
      >
        <DownloadSimpleIcon className="mr-4" size={16} weight="bold" />
        Download
      </li>
    )}
    <li
      className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
      id="viewHistory"
      onClick={showHistory}
    >
      <ClockIcon className="mr-4" size={16} weight="bold" />
      View History
    </li>
    {["sent", "overdue", "viewed"].includes(invoice?.status) && (
      <>
        <li
          className="flex cursor-pointer items-center py-2 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
          onClick={() => markInvoiceAsPaid(invoice.id)}
        >
          <CurrencyCircleDollarIcon className="mr-4" size={16} weight="bold" />
          Mark as Paid
        </li>
        <li
          className="flex cursor-pointer items-center py-2 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
          onClick={wavieInvoice}
        >
          <img className="mr-4" height="16px" src={WaiveSVG} width="16px" />
          Waive Off
        </li>
      </>
    )}
    {invoice?.status === "overdue" && (
      <li
        className="flex cursor-pointer items-center py-2 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
        onClick={() => {
          setIsSendReminder(true);
          sendInvoice();
          setIsMoreOptionsVisible(false);
        }}
      >
        <ReminderIcon className="mr-4" id="reminderIcon" size={16} />
        Send Reminder
      </li>
    )}
    <li
      className="flex cursor-pointer items-center py-2 px-4 text-miru-red-400 hover:bg-miru-gray-100"
      onClick={deleteInvoice}
    >
      <DeleteIcon className="mr-4" size={16} weight="bold" />
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
  showHistory: () => void;
  setIsSendReminder: (value: boolean) => void;
  sendInvoice?: () => void;
  setIsMoreOptionsVisible?: (value: boolean) => void;
}

export default MoreOptions;
