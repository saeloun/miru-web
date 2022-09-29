import * as React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";

import getStatusCssClass from "utils/getStatusTag";

const formattedDate = (date, format) => dayjs(date).format(format);

const SearchDataRow = ({ invoice }) => {
  const navigate = useNavigate();
  const formattedAmount = (invoice) =>
    currencyFormat({
      baseCurrency: invoice.company.baseCurrency,
      amount: invoice.amount
    });

  const handleClick = (invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  return (
    <div
      onClick={() => handleClick(invoice)}
      className="last:border-b-0 py-2 hover:bg-miru-gray-100 group flex items-center cursor-pointer"
    >
      <div className="w-5/12 px-6 font-medium ftracking-wider">
        <div className="font-semibold capitalize text-miru-dark-purple-1000">
          {invoice.client.name}
        </div>
        <div className="text-sm font-normal text-miru-dark-purple-400">
          {invoice.invoiceNumber}
        </div>
      </div>

      <div className="w-4/12 px-6 font-medium tracking-wider">
        {formattedAmount(invoice)}
        <div className="text-sm font-normal text-miru-dark-purple-400">
          {formattedDate(invoice.issueDate, invoice.company.dateFormat)}
        </div>
      </div>

      <div className="w-3/12 px-6 font-medium">
        <span className={getStatusCssClass(invoice.status) + " uppercase"}>
          {invoice.status}
        </span>
      </div>
    </div>
  );
};

export default SearchDataRow;
