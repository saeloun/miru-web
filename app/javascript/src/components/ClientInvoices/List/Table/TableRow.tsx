import React, { useState, useRef } from "react";

import { currencyFormat, useDebounce } from "helpers";
import { Link } from "react-router-dom";
import { Avatar, Badge, Tooltip } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const TableRow = ({ invoice, index }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showToolTip, setShowToolTip] = useState<boolean>(false);
  useDebounce(isMenuOpen, 500);
  const toolTipRef = useRef(null);

  const {
    amount,
    client,
    company,
    dueDate,
    invoiceNumber,
    issueDate,
    status,
    externalViewKey,
  } = invoice;

  const { baseCurrency } = company;
  const { name, logo } = client;

  const handleTooltip = () => {
    if (toolTipRef?.current?.offsetWidth < toolTipRef?.current?.scrollWidth) {
      setShowToolTip(true);
    } else {
      setShowToolTip(false);
    }
  };

  return (
    <tr
      className="group last:border-b-0 md:hover:bg-muted"
      id="invoicesListTableRow"
      key={index}
    >
      <td>
        <Tooltip content={name} show={showToolTip}>
          <Link
            to={`/invoices/${externalViewKey}`}
            className="flex w-40 items-center py-5 pr-2 text-left font-medium tracking-normal outline-none sm:w-80 md:w-96 lg:w-full"
          >
            <Avatar url={logo} />
            <div
              className="ml-2 overflow-hidden truncate whitespace-nowrap lg:ml-4"
              ref={toolTipRef}
              onMouseEnter={handleTooltip}
            >
              <span className="text-sm font-semibold capitalize leading-4 text-foreground lg:text-base lg:leading-5">
                {name}
              </span>
              <h3 className="text-xs font-medium leading-4 text-muted-foreground lg:text-sm lg:leading-5">
                {invoiceNumber}
              </h3>
              <span className="sr-only">View invoice {invoiceNumber}</span>
            </div>
          </Link>
        </Tooltip>
      </td>
      <td className="hidden w-1/4 whitespace-nowrap px-4 py-5 font-medium tracking-normal lg:table-cell lg:px-6">
        <h1 className="text-xs font-normal text-foreground lg:text-base lg:font-semibold">
          {issueDate}
        </h1>
        <h3 className="text-xs font-medium text-muted-foreground lg:text-sm">
          Due on {dueDate}
        </h3>
      </td>
      <td className="hidden px-2 text-right text-sm font-bold tracking-normal text-foreground lg:table-cell lg:w-1/6 lg:px-6 lg:pt-2 lg:pb-7 lg:text-xl">
        {currencyFormat(baseCurrency, amount)}
      </td>
      <td
        className="relative px-2 text-right font-medium lg:px-6 lg:pb-10"
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <Badge
          className={`${getStatusCssClass(status)} uppercase`}
          text={status}
        />
        <dl className="text-right text-sm font-medium leading-5 lg:hidden">
          <dt className="mt-1">{currencyFormat(baseCurrency, amount)}</dt>
        </dl>
      </td>
    </tr>
  );
};

export default TableRow;
