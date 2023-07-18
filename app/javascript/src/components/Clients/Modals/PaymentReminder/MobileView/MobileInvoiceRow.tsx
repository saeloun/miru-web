import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import { Badge, Button } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const MobileInvoiceRow = ({ invoice, isLast }) => {
  const navigate = useNavigate();

  const {
    amount,
    company,
    dueDate,
    invoiceNumber,
    issueDate,
    status,
    externalViewKey,
  } = invoice;

  const { baseCurrency } = company;

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
        <div>{currencyFormat(baseCurrency, amount)}</div>
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
      <div>
        <span />
        <div>
          <Button className="py-2 px-5 text-base" style="primary">
            <a
              href={`/invoices/${externalViewKey}`}
              rel="noreferrer"
              target="_blank"
              onClick={() => navigate(`/invoices/${externalViewKey}/view`)}
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
