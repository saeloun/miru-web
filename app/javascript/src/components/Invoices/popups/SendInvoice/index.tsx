import React, {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";

import { ApiStatus as InvoiceStatus } from "constants/index";

import cn from "classnames";
import { useOutsideClick } from "helpers";
import { X } from "phosphor-react";
import { useNavigate } from "react-router-dom";

import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";

import {
  isEmailValid,
  emailSubject,
  emailBody,
  isDisabled,
  buttonText
} from "./utils";

interface InvoiceEmail {
  subject: string;
  message: string;
  recipients: string[];
}

const Recipient: React.FC<{ email: string; handleClick: any }> = ({
  email,
  handleClick
}) => (
  <div className="flex items-center px-2 py-1 m-0.5 space-x-2 border rounded-full bg-miru-gray-400 w-fit">
    <p>{email}</p>

    <button
      type="button"
      className="text-miru-black-1000 hover:text-miru-red-400"
      onClick={handleClick}
    >
      <X size={14} weight="bold" />
    </button>
  </div>
);

const SendInvoice: React.FC<any> = ({ invoice, setIsSending, isSending }) => {
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [invoiceEmail, setInvoiceEmail] = useState<InvoiceEmail>({
    subject: emailSubject(invoice),
    message: emailBody(invoice),
    recipients: [invoice.client.email]
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
    try {
      event.preventDefault();
      setStatus(InvoiceStatus.LOADING);

      const payload = { invoice_email: invoiceEmail };
      const resp = await invoicesApi.sendInvoice(invoice.id, payload);

      Toastr.success(resp.data.message);
      setStatus(InvoiceStatus.SUCCESS);
    } catch (error) {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  const handleRemove = (recipient: string) => {
    const recipients = invoiceEmail.recipients.filter((r) => r !== recipient);

    setInvoiceEmail({
      ...invoiceEmail,
      recipients
    });
  };

  const handleInput = (event: KeyboardEvent) => {
    const recipients = invoiceEmail.recipients;

    if (isEmailValid(newRecipient) && event.key === "Enter") {
      setInvoiceEmail({
        ...invoiceEmail,
        recipients: recipients.concat(newRecipient)
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
      className="fixed inset-0 z-10 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div
          ref={modal}
          className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mt-2 mb-6">
              <h6 className="form__title">
                Send Invoice #{invoice.invoiceNumber}
              </h6>
              <button
                type="button"
                className="text-miru-gray-1000"
                onClick={() => setIsSending(false)}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form className="space-y-4">
              <fieldset className="flex flex-col field_with_errors">
                <label htmlFor="to" className="mb-2 form__label">
                  To
                </label>

                <div
                  onClick={() => input.current.focus()}
                  className={cn(
                    "p-1.5 rounded bg-miru-gray-100 flex flex-wrap",
                    { "h-9": !invoiceEmail.recipients }
                  )}
                >
                  {invoiceEmail.recipients.map((recipient) => (
                    <Recipient
                      key={recipient}
                      email={recipient}
                      handleClick={() => handleRemove(recipient)}
                    />
                  ))}

                  <input
                    ref={input}
                    style={{ width }}
                    className={cn(
                      "py-2 mx-1.5 rounded bg-miru-gray-100 w-fit cursor-text focus:outline-none",
                      {
                        "text-miru-red-400": !isEmailValid(newRecipient)
                      }
                    )}
                    type="email"
                    name="to"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value.trim())}
                    onKeyDown={handleInput}
                  />
                </div>
              </fieldset>

              <fieldset className="flex flex-col field_with_errors">
                <label htmlFor="subject" className="mb-2 form__label">
                  Subject
                </label>

                <input
                  className="p-1.5 rounded bg-miru-gray-100"
                  type="text"
                  name="subject"
                  value={invoiceEmail.subject}
                  onChange={(e) =>
                    setInvoiceEmail({
                      ...invoiceEmail,
                      subject: e.target.value
                    })
                  }
                />
              </fieldset>

              <fieldset className="flex flex-col field_with_errors">
                <label htmlFor="body" className="mb-2 form__label">
                  Message
                </label>

                <textarea
                  name="body"
                  className="p-1.5 rounded bg-miru-gray-100"
                  value={invoiceEmail.message}
                  onChange={(e) =>
                    setInvoiceEmail({ ...invoiceEmail, message: e.target.value })
                  }
                  rows={5}
                />
              </fieldset>

              <div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={cn(
                    "flex justify-center w-full p-3 mt-6 text-lg font-bold text-white uppercase border border-transparent rounded-md shadow-sm bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-miru-han-purple-600",
                    {
                      "hover:bg-miru-chart-green-400 bg-miru-chart-green-600":
                        status === InvoiceStatus.SUCCESS
                    }
                  )}
                  data-cy ="send-email"
                  disabled={isDisabled(status)}
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
