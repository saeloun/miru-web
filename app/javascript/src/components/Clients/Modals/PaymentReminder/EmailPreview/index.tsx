import React from "react";

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
      <div className="my-6 xsm:max-w-screen-xsm xsm:px-2 lg:max-w-screen-lg lg:px-0">
        <CustomAdvanceInput
          id="Email ID"
          label="Email ID"
          value={emailParams.recipients.map(recipient => (
            <div
              className="m-0.5 flex w-fit items-center space-x-2 rounded-full border bg-miru-gray-400 px-2 py-1"
              key={recipient}
            >
              <p>{recipient}</p>
            </div>
          ))}
        />
      </div>
      <div className="mb-6 xsm:max-w-screen-xsm xsm:px-2 lg:max-w-screen-lg lg:px-0">
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
      <div className="mb-6 overflow-auto xsm:max-w-screen-xsm xsm:overflow-visible xsm:px-2 lg:max-w-screen-lg lg:px-0">
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
