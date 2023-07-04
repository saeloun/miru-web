import React, { useState } from "react";

import classNames from "classnames";
import { Toastr } from "StyledComponents";

import clientApi from "apis/clients";

import MessageTab from "./MessageTab";

const SendPaymentReminder = ({
  selectedInvoices,
  invoices,
  client,
  setSendPaymentReminder,
  setActiveTab,
}) => {
  const [emailParams, setEmailParams] = useState<SendPaymentReminderEmail>({
    subject: "Reminder to complete payments for unpaid invoices",
    message:
      "This is a gentle reminder to complete payments for the following invoices. You can find the respective payment links along with the invoice details given below",
    selected_invoices: selectedInvoices,
    recipients: [client.email],
  });

  const handleClick = async () => {
    try {
      await clientApi.sendPaymentReminder(client.id, emailParams);
      setSendPaymentReminder(false);
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  return (
    <form className="space-y-4">
      <fieldset className="field_with_errors flex flex-col">
        <label className="form__label mb-2" htmlFor="to">
          To
        </label>
        <div
          className={classNames(
            "flex flex-wrap rounded bg-miru-gray-100 p-1.5",
            {
              "h-9": !emailParams.recipients,
            }
          )}
        >
          {emailParams.recipients.map(recipient => (
            <div
              className="m-0.5 flex w-fit items-center space-x-2 rounded-full border bg-miru-gray-400 px-2 py-1"
              key={recipient}
            >
              <p>{recipient}</p>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset className="field_with_errors flex flex-col">
        <label className="form__label mb-2" htmlFor="subject">
          Subject
        </label>
        <input
          className="rounded bg-miru-gray-100 p-1.5"
          name="subject"
          type="text"
          value={emailParams.subject}
          onChange={e =>
            setEmailParams({
              ...emailParams,
              subject: e.target.value,
            })
          }
        />
      </fieldset>
      <div className="mt-3 rounded-md border border-gray-300">
        <label className="relative bottom-3 left-3 font-manrope text-xs text-miru-dark-purple-600">
          Message
        </label>
        <p>
          This is a gentle reminder to complete payments for the following
          invoices. You can find the respective payment links along with the
          invoice details given below
        </p>
        {invoices
          .filter(invoice => selectedInvoices.includes(invoice.id))
          .map((invoice, idx) => (
            <MessageTab invoice={invoice} key={idx} />
          ))}
      </div>
      <div className="flex text-right">
        <button
          type="button"
          className="shadow-smfocus:outline-none mt-6 flex cursor-pointer justify-center rounded-md border border-transparent border-miru-han-purple-1000
                  bg-white p-3 text-sm font-bold uppercase text-miru-han-purple-1000"
          onClick={() => setActiveTab("select_invoices")}
        >
          Back
        </button>
        <button
          disabled={selectedInvoices.length < 1}
          type="button"
          className="shadow-smfocus:outline-none mx-2 mt-6 flex cursor-pointer justify-center rounded-md border border-transparent
                  bg-miru-han-purple-1000 p-3 text-sm font-bold uppercase text-white"
          onClick={e => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Send Reminder
        </button>
      </div>
    </form>
  );
};

interface SendPaymentReminderEmail {
  subject: string;
  message: string;
  recipients: string[];
  selected_invoices: [];
}

export default SendPaymentReminder;
