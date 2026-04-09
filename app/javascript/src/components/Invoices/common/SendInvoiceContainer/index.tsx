import React, { useEffect, useState } from "react";

import cn from "classnames";
import { Formik, Form, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import { Toastr } from "StyledComponents";

import { invoicesApi } from "apis/api";
import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { InputErrors } from "common/FormikFields";
import {
  emailBody,
  emailSubject,
  buttonText,
  getInitialRecipients,
  isEmailValid,
  isDisabled,
} from "components/Invoices/common/InvoiceForm/SendInvoice/utils";
import { ApiStatus as InvoiceStatus } from "constants/index";
import { i18n } from "../../../../i18n";

const SendInvoiceContainer = ({
  invoice,
  setIsSending,
  setIsSendReminder = _value => {},
  isSendReminder = false,
}) => {
  const Recipient: React.FC<{
    email: string;
    handleClick: any;
    recipientsCount: any;
  }> = ({ email, handleClick, recipientsCount }) => (
    <div className="space-XIcon-2 m-0.5 flex w-fit items-center rounded-full border bg-secondary px-2 py-1 text-sm font-medium">
      <p>{email}</p>
      {recipientsCount > 1 && (
        <button
          className="text-foreground hover:text-destructive"
          type="button"
          onClick={handleClick}
        >
          <XIcon size={14} weight="bold" />
        </button>
      )}
    </div>
  );

  interface InvoiceEmail {
    recipients: string[];
    subject: string;
    message: string;
  }

  const [invoiceEmail, setInvoiceEmail] = useState<InvoiceEmail>({
    subject: emailSubject(invoice, isSendReminder),
    message: emailBody(invoice, isSendReminder),
    recipients: getInitialRecipients(invoice),
  });

  const [newRecipient, setNewRecipient] = useState<string>("");
  const [_width, setWidth] = useState<string>("10ch");
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);

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
      Toastr.error("Please enter a valid email address");

      return;
    }

    if (invoiceEmail.recipients.includes(email)) {
      setNewRecipient("");

      return;
    }

    if (invoiceEmail.recipients.length >= 5) {
      Toastr.error("Email can only be sent to 5 recipients.");

      return;
    }

    setInvoiceEmail({
      ...invoiceEmail,
      recipients: [...invoiceEmail.recipients, email],
    });
    setNewRecipient("");
  };

  const handleSubmit = async event => {
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
      setIsSending(false);
      setIsSendReminder(false);
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  useEffect(() => {
    const length = newRecipient.length;
    setWidth(`${length > 10 ? length : 10}ch`);
  }, [newRecipient]);

  return (
    <div className="h-full w-full p-4">
      <Formik
        initialValues={{
          recipients: [""],
          subject: invoiceEmail.subject,
          message: invoiceEmail.message,
        }}
        onSubmit={handleSubmit}
      >
        {(props: FormikProps<InvoiceEmail>) => {
          const { touched, errors } = props;

          return (
            <Form className="flex h-full flex-col justify-between">
              <div className="pt-2">
                <div className="mb-6">
                  <CustomAdvanceInput
                    id="Email ID"
                    label={i18n.t("invoices.recipientEmailId")}
                    wrapperClassName="h-full"
                    value={
                      <div className="space-y-2">
                        <div
                          className={cn("flex flex-wrap rounded p-1.5", {
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
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded border border-border bg-white px-3 py-2 text-sm"
                            data-testid="invoice-recipient-input"
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
                          <button
                            type="button"
                            data-testid="invoice-recipient-add"
                            className="rounded bg-secondary px-3 py-2 text-sm font-medium"
                            onClick={handleAddRecipient}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    }
                  />
                  <InputErrors
                    fieldErrors={errors.recipients}
                    fieldTouched={touched.recipients}
                  />
                </div>
                <div className="mb-6">
                  <CustomTextareaAutosize
                    id="subject"
                    label={i18n.t("invoices.subject")}
                    maxRows={12}
                    name="subject"
                    rows={5}
                    value={invoiceEmail.subject}
                    onChange={e =>
                      setInvoiceEmail({
                        ...invoiceEmail,
                        subject: e.target.value,
                      })
                    }
                  />
                  <InputErrors
                    fieldErrors={errors.subject}
                    fieldTouched={touched.subject}
                  />
                </div>
                <div className="mb-6">
                  <CustomTextareaAutosize
                    id="message"
                    label={i18n.t("invoices.message")}
                    maxRows={12}
                    name="message"
                    rows={5}
                    value={invoiceEmail.message}
                    onChange={e =>
                      setInvoiceEmail({
                        ...invoiceEmail,
                        message: e.target.value,
                      })
                    }
                  />
                  <InputErrors
                    fieldErrors={errors.message}
                    fieldTouched={touched.message}
                  />
                </div>
              </div>
              <button
                type="button"
                className={cn(
                  `mt-6 flex w-full justify-center rounded-md border border-transparent p-3 text-base font-bold
                     text-white shadow-sm
                    ${
                      invoiceEmail?.recipients.length > 0 &&
                      status !== InvoiceStatus.LOADING
                        ? `focus:outline-none cursor-pointer bg-primary hover:bg-primary/90 focus:ring-2
                        focus:ring-ring focus:ring-offset-2`
                        : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                    }
                    `,
                  {
                    "bg-emerald-600 hover:bg-emerald-500":
                      status === InvoiceStatus.SUCCESS,
                  }
                )}
                disabled={
                  invoiceEmail?.recipients.length <= 0 || isDisabled(status)
                }
                onClick={handleSubmit}
              >
                {isSendReminder
                  ? i18n.t("invoices.sendReminder")
                  : buttonText(status)}
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SendInvoiceContainer;
