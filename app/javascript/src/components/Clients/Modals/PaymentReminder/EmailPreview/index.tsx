import React from "react";

import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";

import InvoiceRow from "./InvoiceRow";

const EmailPreview = ({
  selectedInvoices,
  invoices,
  emailParams,
  setEmailParams,
}) => {
  const selected = invoices.filter(invoice =>
    selectedInvoices.includes(invoice.id)
  );

  return (
    <div className="mt-4 h-full overflow-y-auto pb-10/100">
      <div className="my-6">
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
      <div className="mb-6">
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
      <div className="mb-6">
        <CustomAdvanceInput
          id="message"
          label="Message"
          value={
            <div className="mt-3">
              <p className="mb-10">
                This is a gentle reminder to complete payments for the following
                invoices. You can find the respective payment links along with
                the invoice details given below
              </p>
              {selected.map((invoice, idx) => (
                <InvoiceRow
                  invoice={invoice}
                  isLast={selected.length == idx + 1}
                  key={idx}
                />
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default EmailPreview;
