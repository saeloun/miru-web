import React from "react";

import { currencyFormat } from "helpers";
import { Badge, Button } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const MobileInvoiceRow = ({ invoice, isLast }) => {
  const {
    amount,
    currency,
    dueDate,
    invoiceNumber,
    issueDate,
    status,
    externalViewKey,
  } = invoice;

  return (
    <div
      className={`${
        isLast ? "border-0" : "mb-10 border-b border-miru-gray-200"
      } grid grid-cols-2 gap-4`}
    >
      <div>
        <span>INVOICE NO.</span>
        <div>{invoiceNumber}</div>
      </div>
      <div>
        <span>ISSUED DATE</span>
        <div>{issueDate}</div>
      </div>
      <div>
        <span>DUE DATE</span>
        <div>{dueDate}</div>
      </div>
      <div>
        <span>AMOUNT</span>
        <div>{currencyFormat(currency, amount)}</div>
      </div>
      <div>
        <span>STATUS</span>
        <div>
          <Badge
            className={`${getStatusCssClass(status)} uppercase`}
            text={status}
          />
        </div>
      </div>
      <div className="pb-8">
        <span />
        <div>
          <Button className="py-2 px-5 text-base" style="primary">
            <a
              href={`/invoices/${externalViewKey}/view`}
              rel="noreferrer"
              target="_blank"
            >
              View Invoice
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileInvoiceRow;
