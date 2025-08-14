import React, { useState, useEffect } from "react";

import cn from "classnames";
import { Formik, Form, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { InputErrors } from "common/FormikFields";
import {
  emailBody,
  emailSubject,
  buttonText,
  isDisabled,
} from "components/Invoices/common/InvoiceForm/SendInvoice/utils";
import { ApiStatus as InvoiceStatus } from "constants/index";

const SendInvoiceContainer = ({
  invoice,
  handleSaveSendInvoice,
  setIsSending,

  setIsSendReminder = _value => {},
  isSendReminder = false,
}) => {
  const Recipient: React.FC<{
    email: string;
    handleClick: any;
    recipientsCount: any;
  }> = ({ email, handleClick, recipientsCount }) => (
    <div className="space-XIcon-2 m-0.5 flex w-fit items-center rounded-full border bg-miru-gray-400 px-2 py-1 text-sm font-medium">
      <p>{email}</p>
      {recipientsCount > 1 && (
        <button
          className="text-miru-black-1000 hover:text-miru-red-400"
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
    recipients: invoice.client.clientMembersEmails,
  });

  const [newRecipient, setNewRecipient] = useState<string>("");

  const [width, setWidth] = useState<string>("10ch");
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  // const [height, setHeight] = useState<string>("h-0 py-0");

  // const input: React.RefObject<HTMLInputElement> = useRef();
  const navigate = useNavigate();

  const handleRemove = (recipient: string) => {
    const recipients = invoiceEmail.recipients.filter(r => r !== recipient);

    setInvoiceEmail({
      ...invoiceEmail,
      recipients,
    });
  };

  // const handleInput = event => {
  //   const recipients = invoiceEmail.recipients;

  //   if (isEmailValid(newRecipient) && event.key === "Enter") {
  //     setInvoiceEmail({
  //       ...invoiceEmail,
  //       recipients: recipients.concat(newRecipient),
  //     });
  //     setNewRecipient("");
  //   }
  // };

  const handleSubmit = async event => {
    try {
      event.preventDefault();
      setStatus(InvoiceStatus.LOADING);
      if (handleSaveSendInvoice) {
        const res = await handleSaveSendInvoice();
        if (res.status === 200) {
          handleSendInvoice(res.data.id);
        } else {
          Toastr.error("Send invoice failed");
          setStatus(InvoiceStatus.ERROR);
        }
      } else {
        const payload = { invoice_email: invoiceEmail };
        let resp;
        if (isSendReminder) {
          resp = await invoicesApi.sendReminder(invoice.id, payload);
        } else {
          resp = await invoicesApi.sendInvoice(invoice.id, payload);
        }
        Toastr.success(resp.data.message);
      }
      setIsSending(false);
      setIsSendReminder(false);
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  const handleSendInvoice = async invoiceId => {
    try {
      const payload = { invoice_email: invoiceEmail };
      const resp = await invoicesApi.sendInvoice(invoiceId, payload);
      Toastr.success(resp.data.message);
      setStatus(InvoiceStatus.SUCCESS);
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  useEffect(() => {
    const length = newRecipient.length;

    setWidth(`${length > 10 ? length : 10}ch`);
  }, [newRecipient]);

  useEffect(() => {
    setTimeout(() => {
      status === InvoiceStatus.SUCCESS && navigate("/invoices");
    }, 5000);
  }, [status]);

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
                    label="Email ID"
                    wrapperClassName="h-full"
                    value={
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
                        {/* <input
                          name="to"
                          ref={input}
                          style={{ width }}
                          type="email"
                          value={newRecipient}
                          className={cn(
                            "focus:outline-none mx-1.5 w-fit cursor-text",
                            height,
                            {
                              "text-miru-red-400": !isEmailValid(newRecipient),
                            }
                          )}
                          onBlur={() => setHeight("h-0 py-0")}
                          onChange={e => setNewRecipient(e.target.value.trim())}
                          onFocus={() => setHeight("h-6 py-2")}
                          onKeyDown={handleInput}
                        /> */}
                      </div>
                    }
                    // onClick={() => input.current.focus()}
                  />
                  <InputErrors
                    fieldErrors={errors.recipients}
                    fieldTouched={touched.recipients}
                  />
                </div>
                <div className="mb-6">
                  <CustomTextareaAutosize
                    id="subject"
                    label="Subject"
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
                    label="Message"
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
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SendInvoiceContainer;
