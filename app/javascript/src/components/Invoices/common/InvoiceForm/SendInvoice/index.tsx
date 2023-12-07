/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";

import cn from "classnames";
import { useOutsideClick } from "helpers";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

import { ApiStatus as InvoiceStatus } from "constants/index";

import Recipient from "./Recipient";
import { emailSubject, emailBody, isDisabled, buttonText } from "./utils";

const SendInvoice = ({
  status,
  invoice,
  isSending,
  setIsSending,
  handleSubmit,
  isSendReminder = false,
  setIsSendReminder,
}: Iprops) => {
  const [invoiceEmail, setInvoiceEmail] = useState<InvoiceEmail>({
    subject: emailSubject(invoice, isSendReminder),
    message: emailBody(invoice, isSendReminder),
    recipients: invoice.client.clientMembersEmails,
  });

  const navigate = useNavigate();
  const modal = useRef();

  useOutsideClick(modal, () => setIsSending(false), isSending);

  const handleRemove = (recipient: string) => {
    const recipients = invoiceEmail.recipients.filter(r => r !== recipient);

    setInvoiceEmail({
      ...invoiceEmail,
      recipients,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      status === InvoiceStatus.SUCCESS && navigate("/invoices");
    }, 5000);
  }, [status]);

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-10 overflow-y-auto"
      role="dialog"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        />
        <span
          aria-hidden="true"
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
        >
          &#8203;
        </span>
        <div
          className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
          ref={modal}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mt-2 mb-6 flex items-center justify-between">
              <h6 className="form__title">
                Send Invoice #{invoice.invoiceNumber}
              </h6>
              <button
                className="text-miru-gray-1000"
                type="button"
                onClick={() => {
                  isSendReminder
                    ? setIsSendReminder(false)
                    : setIsSending(false);
                }}
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>
            <form className="space-y-4">
              <fieldset className="field_with_errors flex flex-col">
                <label className="form__label mb-2" htmlFor="to">
                  To
                </label>
                <div
                  className={cn(
                    "flex flex-wrap rounded bg-miru-gray-100 p-1.5",
                    { "h-9": !invoiceEmail.recipients }
                  )}
                >
                  {invoiceEmail?.recipients?.map(recipient => (
                    <Recipient
                      email={recipient}
                      handleClick={() => handleRemove(recipient)}
                      key={recipient}
                      recipientsCount={invoiceEmail.recipients.length}
                    />
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
                  value={invoiceEmail.subject}
                  onChange={e =>
                    setInvoiceEmail({
                      ...invoiceEmail,
                      subject: e.target.value,
                    })
                  }
                />
              </fieldset>
              <fieldset className="field_with_errors flex flex-col">
                <label className="form__label mb-2" htmlFor="body">
                  Message
                </label>
                <textarea
                  className="rounded bg-miru-gray-100 p-1.5"
                  name="body"
                  rows={5}
                  value={invoiceEmail.message}
                  onChange={e =>
                    setInvoiceEmail({
                      ...invoiceEmail,
                      message: e.target.value,
                    })
                  }
                />
              </fieldset>
              <div>
                <Button
                  size="medium"
                  style="primary"
                  type="button"
                  className={`mt-6 flex w-full justify-center uppercase ${
                    status === InvoiceStatus.SUCCESS
                      ? "bg-miru-chart-green-600 hover:bg-miru-chart-green-400"
                      : ""
                  }`}
                  disabled={
                    invoiceEmail?.recipients?.length <= 0 || isDisabled(status)
                  }
                  onClick={e => handleSubmit(e, invoiceEmail)}
                >
                  {isSendReminder ? "Send Reminder" : buttonText(status)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InvoiceEmail {
  subject: string;
  message: string;
  recipients: string[];
}

interface Iprops {
  status: any;
  invoice: any;
  isSending: boolean;
  setIsSending: any;
  handleSubmit: any;
  isSendReminder?: boolean;
  setIsSendReminder?: any;
}

export default SendInvoice;
