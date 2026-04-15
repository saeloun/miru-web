import { ApiStatus as InvoiceStatus } from "constants/index";

import React, { useEffect, useState } from "react";

import cn from "classnames";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Modal } from "StyledComponents";

import Recipient from "./Recipient";
import {
  emailSubject,
  emailBody,
  isDisabled,
  buttonText,
  getInitialRecipients,
  isEmailValid,
} from "./utils";
import { i18n } from "../../../../../i18n";

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
    recipients: getInitialRecipients(invoice),
  });
  const [newRecipient, setNewRecipient] = useState("");

  const navigate = useNavigate();

  const handleRemove = (recipient: string) => {
    const recipients = invoiceEmail.recipients.filter(r => r !== recipient);

    setInvoiceEmail({
      ...invoiceEmail,
      recipients,
    });
  };

  const handleAddRecipient = () => {
    const email = newRecipient.trim();

    if (!email) return;

    if (!isEmailValid(email)) {
      toast.error(i18n.t("invoices.addEmailFromClientSettings"));

      return;
    }

    if (invoiceEmail.recipients.includes(email)) {
      setNewRecipient("");

      return;
    }

    if (invoiceEmail.recipients.length >= 5) {
      toast.error("Email can only be sent to 5 recipients.");

      return;
    }

    setInvoiceEmail({
      ...invoiceEmail,
      recipients: [...invoiceEmail.recipients, email],
    });
    setNewRecipient("");
  };

  useEffect(() => {
    setTimeout(() => {
      if (status === InvoiceStatus.SUCCESS) {
        navigate("/invoices");
      }
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
      <div className="bg-background text-foreground">
        <div className="mt-2 mb-6 flex items-center justify-between">
          <h6 className="form__title">
            {isSendReminder
              ? i18n.t("invoices.sendInvoiceReminder")
              : `${i18n.t("invoices.sendInvoice")} #${invoice.invoiceNumber}`}
          </h6>
          <button
            className="text-foreground"
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
          <div className="mb-6 w-full items-center justify-center rounded bg-rose-100 p-2 text-center font-sans text-xs tracking-xs-widest text-rose-700">
            <p>{i18n.t("invoices.addEmailFromClientSettings")}</p>
          </div>
        )}
        <form className="space-y-4">
          <fieldset className="field_with_errors flex flex-col">
            <label className="form__label mb-2" htmlFor="to">
              {i18n.t("to")}
            </label>
            <div
              className={cn(`flex flex-wrap rounded bg-muted p-1.5`, {
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
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded bg-muted p-1.5"
                data-testid="invoice-recipient-input"
                name="recipient"
                placeholder={i18n.t("invoices.recipientEmailId")}
                type="email"
                value={newRecipient}
                onChange={e => setNewRecipient(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
              />
              <Button
                size="small"
                style="secondary"
                type="button"
                data-testid="invoice-recipient-add"
                onClick={handleAddRecipient}
              >
                Add
              </Button>
            </div>
          </fieldset>
          <fieldset className="field_with_errors flex flex-col">
            <label className="form__label mb-2" htmlFor="subject">
              {i18n.t("invoices.subject")}
            </label>
            <input
              className="rounded bg-muted p-1.5"
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
              {i18n.t("invoices.message")}
            </label>
            <textarea
              className="rounded bg-muted p-1.5"
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
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : ""
              }`}
              disabled={
                invoiceEmail?.recipients?.length <= 0 || isDisabled(status)
              }
              onClick={e => handleSubmit(e, invoiceEmail)}
            >
              {isSendReminder
                ? i18n.t("invoices.sendReminder")
                : buttonText(status)}
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
