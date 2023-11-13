/* eslint-disable no-unused-vars */
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
import { Modal, Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import { CustomInputText } from "common/CustomInputText";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import Recipient from "components/Invoices/common/InvoiceForm/SendInvoice/Recipient";
import { ApiStatus as InvoiceStatus } from "constants/index";
import { useUserContext } from "context/UserContext";

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

const SendInvoice: React.FC<any> = ({
  invoice,
  setIsSending,
  isSending,
  isSendReminder,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsSendReminder = _value => {},
}) => {
  const { user } = useUserContext();
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [invoiceEmail, setInvoiceEmail] = useState<InvoiceEmail>({
    subject: emailSubject(invoice, isSendReminder),
    message: emailBody(invoice, isSendReminder),
    recipients: invoice.client.clientMembersEmails,
  });
  const [newRecipient, setNewRecipient] = useState<string>("");
  const [width, setWidth] = useState<string>("10ch");

  const navigate = useNavigate();
  const modal = useRef();
  const input: React.RefObject<HTMLInputElement> = useRef();

  useOutsideClick(modal, () => {
    if (isSendReminder) {
      setIsSending(false), isSending;
      setIsSendReminder(false), isSendReminder;
    } else {
      setIsSending(false), isSending;
    }
  });

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
        setIsSendReminder(false);
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
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={isSending}
      onClose={() => {
        if (isSendReminder) {
          setIsSending(false);
          setIsSendReminder(false);
        } else {
          setIsSending(false);
        }
      }}
    >
      <div className="bg-white">
        <div className="mt-2 mb-6 flex items-center justify-between">
          <h6 className="form__title">
            {isSendReminder
              ? "Send Invoice Reminder"
              : `Send Invoice #${invoice.invoiceNumber}`}
          </h6>
          <button
            className="text-miru-gray-1000"
            type="button"
            onClick={() => {
              if (isSendReminder) {
                setIsSending(false);
                setIsSendReminder(false);
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
            <CustomAdvanceInput
              id="Email ID"
              inputBoxClassName="py-3"
              label="Email ID"
              wrapperClassName="h-full"
              value={
                <div
                  className={cn("flex flex-wrap rounded", {
                    "h-9": !invoiceEmail.recipients,
                  })}
                >
                  {invoiceEmail.recipients.map(recipient => (
                    <Recipient
                      email={recipient}
                      handleClick={() => handleRemove(recipient)}
                      key={recipient}
                      recipientsCount={invoiceEmail.recipients.length}
                    />
                  ))}
                </div>
              }
            />
          </fieldset>
          <fieldset className="field_with_errors flex flex-col">
            <CustomInputText
              id="subject"
              inputBoxClassName="border focus:border-miru-han-purple-1000"
              label="Subject"
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
            <CustomTextareaAutosize
              id="message"
              label="Message"
              maxRows={5}
              name="message"
              rows={5}
              value={invoiceEmail.message}
              onChange={e => {
                setInvoiceEmail({
                  ...invoiceEmail,
                  message: e.target.value,
                });
              }}
            />
          </fieldset>
          <div>
            <button
              type="button"
              className={cn(
                `mt-6 flex w-full justify-center rounded-md border border-transparent p-3 text-lg font-bold
                    uppercase text-white shadow-sm
                    ${
                      invoiceEmail?.recipients.length > 0 &&
                      status !== InvoiceStatus.LOADING
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
