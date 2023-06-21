/* eslint-disable no-unused-vars */
import React, {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import cn from "classnames";
import { XIcon } from "miruIcons";
import { Modal, Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import { ApiStatus as InvoiceStatus } from "constants/index";

import {
  isEmailValid,
  emailSubject,
  emailBody,
  isDisabled,
  buttonText,
} from "./utils";

interface InvoiceEmail {
  subject: string;
  message: string;
  recipients: string[];
}

const Recipient: React.FC<{ email: string; handleClick: any }> = ({
  email,
  handleClick,
}) => (
  <div className="m-0.5 flex w-fit items-center space-x-2 rounded-full border bg-miru-gray-400 px-2 py-1">
    <p>{email}</p>
    {/* <button
      className="text-miru-black-1000 hover:text-miru-red-400"
      type="button"
      onClick={handleClick}
    >
      <XIcon size={14} weight="bold" />
    </button> */}
  </div>
);

const SendInvoice: React.FC<any> = ({
  isSending,
  setIsSending,
  invoice,
  fetchInvoices,
  isSendReminder = false,
  setISendReminder,
}) => {
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [invoiceEmail, setInvoiceEmail] = useState<InvoiceEmail>({
    subject: emailSubject(invoice, isSendReminder),
    message: emailBody(invoice, isSendReminder),
    recipients: [invoice.client.email],
  });
  const [newRecipient, setNewRecipient] = useState<string>("");
  const [width, setWidth] = useState<string>("10ch");

  const input: React.RefObject<HTMLInputElement> = useRef();

  useEffect(() => {
    const length = newRecipient.length;

    setWidth(`${length > 10 ? length : 10}ch`);
  }, [newRecipient]);

  const handleSubmit = async (event: FormEvent) => {
    if (invoiceEmail?.recipients.length > 0) {
      try {
        event.preventDefault();
        setStatus(InvoiceStatus.LOADING);

        const payload = { invoice_email: invoiceEmail };
        let resp;
        if (isSendReminder) {
          resp = await invoicesApi.sendReminder(invoice.id, payload);
        } else {
          resp = await invoicesApi.sendInvoice(invoice.id, payload);
        }

        Toastr.success(resp.data.message);
        setStatus(InvoiceStatus.SUCCESS);
        setIsSending(false);
        setISendReminder(false);
        setTimeout(fetchInvoices, 6000);
      } catch {
        setStatus(InvoiceStatus.ERROR);
      }
    }
  };

  const handleRemove = (recipient: string) => {
    const recipients = invoiceEmail.recipients.filter(r => r !== recipient);

    setInvoiceEmail({
      ...invoiceEmail,
      recipients,
    });
  };

  const handleInput = (event: KeyboardEvent) => {
    const recipients = invoiceEmail.recipients;

    if (isEmailValid(newRecipient) && event.key === "Enter") {
      setInvoiceEmail({
        ...invoiceEmail,
        recipients: recipients.concat(newRecipient),
      });
      setNewRecipient("");
    }
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={isSending}
      onClose={() => {
        if (isSendReminder) {
          setIsSending(false);
          setISendReminder(false);
        } else {
          setIsSending(false);
        }
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        <div className="mt-2 mb-6 flex items-center justify-between">
          <h6 className="form__title">Send Invoice #{invoice.invoiceNumber}</h6>
          <button
            className="text-miru-gray-1000"
            type="button"
            onClick={() => {
              if (isSendReminder) {
                setIsSending(false);
                setISendReminder(false);
              } else {
                setIsSending(false);
              }
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
              className={cn("flex flex-wrap rounded bg-miru-gray-100 p-1.5", {
                "h-9": !invoiceEmail.recipients,
              })}
              // onClick={() => input.current.focus()}
            >
              {invoiceEmail.recipients.map(recipient => (
                <Recipient
                  email={recipient}
                  handleClick={() => handleRemove(recipient)}
                  key={recipient}
                />
              ))}
              {/* <input
                name="to"
                ref={input}
                style={{ width }}
                type="email"
                value={newRecipient}
                className={cn(
                  "focus:outline-none mx-1.5 w-fit cursor-text rounded bg-miru-gray-100 py-2",
                  {
                    "text-miru-red-400": !isEmailValid(newRecipient),
                  }
                )}
                onChange={e => setNewRecipient(e.target.value.trim())}
                onKeyDown={handleInput}
              /> */}
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
            <button
              type="button"
              className={cn(
                `mt-6 flex w-full justify-center rounded-md border border-transparent p-3 text-lg font-bold
                uppercase text-white shadow-sm
                ${
                  invoiceEmail?.recipients.length > 0
                    ? `focus:outline-none cursor-pointer bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 focus:ring-2
                    focus:ring-miru-han-purple-600 focus:ring-offset-2`
                    : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                }
                `,
                {
                  "bg-miru-chart-green-600 hover:bg-miru-chart-green-400":
                    status === InvoiceStatus.SUCCESS,
                }
              )}
              disabled={
                invoiceEmail?.recipients.length <= 0 || isDisabled(status)
              }
              onClick={handleSubmit}
            >
              {isSendReminder ? "Send Reminder" : buttonText(status)}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SendInvoice;
