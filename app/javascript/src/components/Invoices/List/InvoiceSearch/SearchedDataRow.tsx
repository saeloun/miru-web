import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import getStatusCssClass from "utils/getBadgeStatus";
import { HighlightText } from "../../../ui/highlight-text";

const SearchDataRow = ({ invoice, searchQuery = "" }) => {
  const navigate = useNavigate();

  const handleClick = invoice => {
    navigate(`/invoices/${invoice.id}`);
  };

  const { client, invoiceNumber, company, amount, issueDate, status } = invoice;

  return (
    <div
      className="group grid cursor-pointer grid-cols-12 items-center gap-2 py-2 last:border-b-0 hover:bg-muted"
      onClick={() => handleClick(invoice)}
    >
      <div className="col-span-6 p-0 font-medium tracking-wider sm:col-span-5">
        <div className="pb-1 text-sm font-medium capitalize text-foreground">
          <HighlightText text={client.name || ""} query={searchQuery} />
        </div>
        <div className="text-sm font-normal text-muted-foreground">
          <HighlightText text={invoiceNumber || ""} query={searchQuery} />
        </div>
      </div>
      <div className="col-span-4 font-bold tracking-wider sm:col-span-4">
        {currencyFormat(company.baseCurrency, amount)}
        <div className="text-sm font-normal text-muted-foreground">
          {issueDate}
        </div>
      </div>
      <div className="col-span-2 text-right font-medium sm:col-span-3">
        <span className={`${getStatusCssClass(status)} uppercase tracking-2`}>
          {status}
        </span>
      </div>
    </div>
  );
};

export default SearchDataRow;
