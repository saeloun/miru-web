import React, {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import cn from "classnames";
import { useOutsideClick } from "helpers";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";
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
  <div className="space-XIcon-2 m-0.5 flex w-fit items-center rounded-full border bg-miru-gray-400 px-2 py-1">
    <p>{email}</p>
    <button
      className="text-miru-black-1000 hover:text-miru-red-400"
      type="button"
      onClick={handleClick}
    >
      <XIcon size={14} weight="bold" />
    </button>
  </div>
);

const SendInvoice: React.FC<any> = ({ invoice, setIsSending, isSending }) => {
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [invoiceEmail, setInvoiceEmail] = useState<InvoiceEmail>({
    subject: emailSubject(invoice),
    message: emailBody(invoice),
    recipients: [invoice.client.email],
  });
  const [newRecipient, setNewRecipient] = useState<string>("");
  const [width, setWidth] = useState<string>("10ch");

  const navigate = useNavigate();
  const modal = useRef();
  const input: React.RefObject<HTMLInputElement> = useRef();

  useOutsideClick(modal, () => setIsSending(false), isSending);
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
        const resp = await invoicesApi.sendInvoice(invoice.id, payload);

        Toastr.success(resp.data.message);
        setStatus(InvoiceStatus.SUCCESS);
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
                onClick={() => setIsSending(false)}
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
                  onClick={() => input.current.focus()}
                >
                  {invoiceEmail.recipients.map(recipient => (
                    <Recipient
                      email={recipient}
                      handleClick={() => handleRemove(recipient)}
                      key={recipient}
                    />
                  ))}
                  <input
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
                  />
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
                  data-cy="send-email"
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
                  {buttonText(status)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendInvoice;
