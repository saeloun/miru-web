import React, { useState, useRef } from "react";

import { useUserContext } from "context/UserContext";
import { currencyFormat } from "helpers";
import { Avatar, Tooltip } from "StyledComponents";

const TableRow = ({ currency, report }) => {
  const { id, name, amount_overdue, logo } = report;
  const [showToolTip, setShowToolTip] = useState<boolean>(false);
  const toolTipRef = useRef(null);
  const { isDesktop } = useUserContext();
  const handleTooltip = () => {
    if (toolTipRef?.current?.offsetWidth <= toolTipRef?.current?.scrollWidth) {
      setShowToolTip(true);
    } else {
      setShowToolTip(false);
    }
  };

  return (
    <tr className="table-cell items-center py-4 lg:flex" key={id}>
      <td className="flex w-full items-center pt-2.5 lg:w-2/12 lg:pr-8 ">
        <Avatar classNameImg="mr-2 lg:mr-6" url={logo} />
        {isDesktop ? (
          <Tooltip content={name} show={showToolTip}>
            <p
              className="overflow-hidden text-ellipsis break-words pr-2 text-sm font-medium text-miru-dark-purple-1000 lg:whitespace-normal lg:text-base"
              ref={toolTipRef}
              onMouseEnter={handleTooltip}
            >
              {name}
            </p>
          </Tooltip>
        ) : (
          <p
            className="overflow-hidden text-ellipsis whitespace-normal pr-2 text-sm font-medium text-miru-dark-purple-1000 lg:whitespace-nowrap lg:text-base"
            ref={toolTipRef}
            onMouseEnter={handleTooltip}
          >
            {name}
          </p>
        )}
      </td>
      <td className="flex items-center justify-between whitespace-pre-wrap py-2.5 text-right text-base font-normal text-miru-dark-purple-1000 lg:table-cell lg:w-2/12 lg:px-8">
        <dt className="text-xs font-medium text-miru-dark-purple-400 lg:hidden">
          0 - 30 DAYS
        </dt>
        <span className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
          {currencyFormat(currency, amount_overdue.zero_to_thirty_days)}
        </span>
      </td>
      <td className="flex items-center justify-between whitespace-nowrap py-2.5 text-right lg:table-cell lg:w-2/12 lg:px-8">
        <dt className="text-xs font-medium text-miru-dark-purple-400 lg:hidden">
          31 - 60 DAYS
        </dt>
        <span className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
          {currencyFormat(currency, amount_overdue.thirty_one_to_sixty_days)}
        </span>
      </td>
      <td className="flex items-center justify-between whitespace-nowrap py-2.5 text-right lg:table-cell lg:w-2/12 lg:px-8">
        <dt className="text-xs font-medium text-miru-dark-purple-400 lg:hidden">
          61 - 90 DAYS
        </dt>
        <span className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
          {currencyFormat(currency, amount_overdue.sixty_one_to_ninety_days)}
        </span>
      </td>
      <td className="flex items-center justify-between whitespace-nowrap py-2.5 text-right lg:table-cell lg:w-2/12 lg:px-8">
        <dt className="text-xs font-medium text-miru-dark-purple-400 lg:hidden">
          90+ DAYS
        </dt>
        <span className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
          {currencyFormat(currency, amount_overdue.ninety_plus_days)}
        </span>
      </td>
      <td className="flex items-center justify-between whitespace-nowrap pb-2.5 text-right text-xl font-bold text-miru-dark-purple-1000 lg:mt-0 lg:table-cell lg:w-2/12 lg:pl-8">
        <dt className="text-xs font-bold text-miru-dark-purple-400 lg:hidden">
          Total
        </dt>
        <span className="text-sm font-bold text-miru-dark-purple-1000 lg:text-base">
          {currencyFormat(currency, amount_overdue.total)}
        </span>
      </td>
    </tr>
  );
};

export default TableRow;
