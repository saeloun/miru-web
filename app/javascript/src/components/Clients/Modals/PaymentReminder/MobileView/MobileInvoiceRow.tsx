import React from "react";

import { currencyFormat } from "helpers";
import { Badge, Button } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";
import { i18n } from "../../../../../i18n";

const MobileInvoiceRow = ({ invoice, isLast }) => {
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
        isLast ? "border-0" : "mb-10 border-b border-border"
      } grid grid-cols-2 gap-4`}
    >
      <div>
        <span>{i18n.t("invoices.invoiceNo")}</span>
        <div>{invoiceNumber}</div>
      </div>
      <div>
        <span>{i18n.t("invoices.issuedDate")}</span>
        <div>{issueDate}</div>
      </div>
      <div>
        <span>{i18n.t("invoices.dueDate")}</span>
        <div>{dueDate}</div>
      </div>
      <div>
        <span>{i18n.t("invoices.amount")}</span>
        <div>{currencyFormat(baseCurrency, amount)}</div>
      </div>
      <div>
        <span>{i18n.t("invoices.status")}</span>
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
          <Button className="px-5 py-2 text-base" style="primary">
            <a
              href={`/invoices/${externalViewKey}/view`}
              rel="noreferrer"
              target="_blank"
            >
              {i18n.t("viewInvoice")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileInvoiceRow;
