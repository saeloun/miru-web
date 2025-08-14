import React from "react";

import cn from "classnames";
import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";

import InvoiceRow from "./InvoiceRow";

import MobileInvoiceRow from "../MobileView/MobileInvoiceRow";

const EmailPreview = ({
  selectedInvoices,
  invoices,
  emailParams,
  setEmailParams,
  isDesktop,
}) => {
  const selected = invoices.filter(invoice =>
    selectedInvoices.includes(invoice.id)
  );

  return (
    <div className="mt-4 h-full overflow-y-auto pb-10/100 xsm:mx-auto">
      <div className="my-6 w-full xsm:px-2 lg:px-0">
        <CustomAdvanceInput
          id="Email ID"
          label="Recipient Email ID"
          wrapperClassName="h-full"
          value={
            <div
              className={cn("flex flex-wrap rounded", {
                "h-9": !emailParams.recipients,
              })}
            >
              {emailParams.recipients.map(recipient => (
                <div
                  className="space-XIcon-2 m-0.5 mr-2 flex w-fit items-center rounded-full border bg-miru-gray-400 px-2 py-1"
                  key={recipient}
                >
                  <p>{recipient}</p>
                </div>
              ))}
            </div>
          }
        />
      </div>
      <div className="mb-6 w-full xsm:px-2 lg:px-0">
        <CustomTextareaAutosize
          id="subject"
          label="Subject"
          maxLength={30}
          maxRows={12}
          name="subject"
          rows={5}
          value={emailParams.subject}
          onChange={e =>
            setEmailParams({
              ...emailParams,
              subject: e.target.value,
            })
          }
        />
      </div>
      <div className="mb-6 w-full overflow-auto xsm:overflow-visible xsm:px-2.5 lg:px-0">
        <CustomAdvanceInput
          id="message"
          label="Message"
          value={
            <div className="mt-3">
              <p className="mb-10">{emailParams.message}</p>
              {selected.map((invoice, idx) =>
                isDesktop ? (
                  <InvoiceRow
                    invoice={invoice}
                    isLast={selected.length == idx + 1}
                    key={idx}
                  />
                ) : (
                  <MobileInvoiceRow
                    invoice={invoice}
                    isLast={selected.length == idx + 1}
                    key={idx}
                  />
                )
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default EmailPreview;
