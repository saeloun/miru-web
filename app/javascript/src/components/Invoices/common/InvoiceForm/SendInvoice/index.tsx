/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";

import cn from "classnames";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "StyledComponents";

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
        {!invoiceEmail?.recipients?.length && (
          <div className="mb-6 w-full items-center justify-center rounded bg-miru-alert-pink-400 p-2 text-center font-manrope text-xs tracking-xs-widest text-miru-alert-red-1000">
            <p>Please add email from client settings page</p>
          </div>
        )}
        <form className="space-y-4">
          <fieldset className="field_with_errors flex flex-col">
            <label className="form__label mb-2" htmlFor="to">
              To
            </label>
            <div
              className={cn(`flex flex-wrap rounded bg-miru-gray-100 p-1.5`, {
                "h-9": !invoiceEmail?.recipients?.length,
              })}
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
    </Modal>
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
