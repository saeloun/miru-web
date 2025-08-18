import React from "react";

import { currencyFormat } from "helpers";
import StatusBadge from "components/ui/status-badge";
import { Link } from "react-router-dom";
import { CreditCard, Buildings, Wallet, Money, ArrowsLeftRight, Receipt } from "phosphor-react";

import { TableRowProps } from "../interfaces";

const TableRow = ({ payment, baseCurrency }: TableRowProps) => {
  const {
    clientName,
    invoiceNumber,
    invoiceId,
    status,
    amount,
    transactionType,
    transactionDate,
    note,
    currency,
    exchangeRate,
  } = payment;

  const getTransactionTypeDisplay = type => {
    const typeMap = {
      credit_card: {
        icon: <CreditCard className="h-4 w-4" />,
        text: "Card Payment",
        color: "text-blue-600",
      },
      bank_transfer: {
        icon: <Buildings className="h-4 w-4" />,
        text: "Bank Transfer",
        color: "text-green-600",
      },
      wire_transfer: {
        icon: <ArrowsLeftRight className="h-4 w-4" />,
        text: "Wire Transfer",
        color: "text-purple-600",
      },
      ach: {
        icon: <Buildings className="h-4 w-4" />,
        text: "ACH Transfer",
        color: "text-teal-600",
      },
      paypal: {
        icon: <Wallet className="h-4 w-4" />,
        text: "PayPal",
        color: "text-blue-500",
      },
      stripe: {
        icon: <CreditCard className="h-4 w-4" />,
        text: "Stripe",
        color: "text-indigo-600",
      },
      cash: {
        icon: <Money className="h-4 w-4" />,
        text: "Cash",
        color: "text-green-700",
      },
      check: {
        icon: <Receipt className="h-4 w-4" />,
        text: "Check",
        color: "text-gray-600",
      },
    };

    const typeInfo = typeMap[type] || {
      icon: <Wallet className="h-4 w-4" />,
      text: type || "Payment",
      color: "text-gray-600",
    };

    return (
      <div className={`inline-flex items-center gap-1.5 ${typeInfo.color}`}>
        {typeInfo.icon}
        <span className="text-xs font-medium lg:text-sm">{typeInfo.text}</span>
      </div>
    );
  };

  // Check if payment currency differs from organization base currency
  const showConversion = currency && baseCurrency && currency !== baseCurrency;
  const convertedAmount =
    showConversion && exchangeRate ? amount * exchangeRate : null;

  return (
    <tr className="group cursor-pointer last:border-b-0 md:hover:bg-miru-gray-100">
      <td className="w-[25%] py-5 pr-2 pl-0 text-left">
        <div className="flex flex-col">
          {invoiceId ? (
            <Link
              to={`/invoices/${invoiceId}`}
              className="text-sm font-semibold leading-4 text-miru-han-purple-600 hover:text-miru-han-purple-1000 hover:underline transition-colors lg:text-base lg:leading-5"
              onClick={e => e.stopPropagation()}
            >
              {invoiceNumber}
            </Link>
          ) : (
            <span className="text-sm font-semibold leading-4 text-miru-dark-purple-1000 lg:text-base lg:leading-5">
              {invoiceNumber || "—"}
            </span>
          )}
          <h3 className="text-xs font-medium leading-4 text-miru-dark-purple-400 lg:text-sm lg:leading-5">
            {clientName || "—"}
          </h3>
        </div>
      </td>
      <td className="w-[20%] whitespace-nowrap px-4 py-5 font-medium tracking-normal lg:px-6">
        <h1 className="text-xs font-normal text-miru-dark-purple-1000 lg:text-base lg:font-semibold">
          {transactionDate || "—"}
        </h1>
        <h3 className="text-xs font-medium text-miru-dark-purple-400 lg:text-sm">
          {getTransactionTypeDisplay(transactionType)}
        </h3>
      </td>
      <td className="w-[25%] px-2 py-5 text-left lg:px-6">
        {note ? (
          <p className="text-xs font-normal leading-4 text-miru-dark-purple-400 lg:text-sm truncate max-w-[200px]">
            {note}
          </p>
        ) : (
          <span className="text-xs text-miru-dark-purple-300">—</span>
        )}
      </td>
      <td className="w-[15%] px-2 text-right text-sm font-bold tracking-normal text-miru-dark-purple-1000 lg:px-6 lg:pt-2 lg:pb-7 lg:text-base">
        <div>
          {amount > 0 ? (
            <>
              {currency
                ? currencyFormat(currency, amount)
                : baseCurrency && currencyFormat(baseCurrency, amount)}
              {showConversion && (
                <div className="text-xs font-normal leading-4 text-miru-dark-purple-400 mt-1">
                  ≈{" "}
                  {convertedAmount
                    ? currencyFormat(baseCurrency, convertedAmount.toFixed(2))
                    : "—"}
                  {convertedAmount && (
                    <span className="ml-1 text-miru-dark-purple-300">
                      ({exchangeRate?.toFixed(2)} rate)
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <span>—</span>
          )}
        </div>
      </td>
      <td className="w-[15%] relative px-2 py-5 text-right font-medium lg:px-6">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
};

export default TableRow;
