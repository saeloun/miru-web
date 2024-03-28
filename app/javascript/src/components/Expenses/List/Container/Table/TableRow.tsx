import React, { Fragment, useState } from "react";

import { currencyFormat } from "helpers";
import { DotsThreeVerticalIcon, ExpenseIconSVG, InvoicesIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import { Categories } from "components/Expenses/utils";
import { useUserContext } from "context/UserContext";

import MoreOptions from "./MoreOptions";

const TableRow = ({ expense, currency }) => {
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  const {
    id,
    expenseType,
    amount,
    categoryName,
    date,
    vendorName,
    description,
    receipts,
  } = expense;

  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  const getCategoryIcon = () => {
    const icon = Categories.find(category => category.label === categoryName)
      ?.icon || <img src={ExpenseIconSVG} />;

    return (
      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-miru-gray-200 p-1 text-miru-dark-purple-600">
        {icon}
      </div>
    );
  };

  const handleExpenseClick = id => {
    navigate(`${id}`);
  };

  return (
    <Fragment>
      <tr
        className="group w-full cursor-pointer py-4 lg:hover:bg-miru-gray-100"
        key={id}
        onClick={() => handleExpenseClick(id)}
      >
        <td className="hidden cursor-pointer py-4 lg:table-cell lg:w-3/12 lg:pr-8 lg:pl-2">
          <div className="flex">
            {getCategoryIcon()}
            <div className="hidden w-full self-center overflow-hidden truncate whitespace-nowrap pr-2 text-base font-medium text-miru-dark-purple-1000 lg:inline-block">
              {categoryName}
            </div>
          </div>
        </td>
        <td className="hidden w-2/12 py-4 pr-4 text-left text-base font-medium text-miru-dark-purple-1000 lg:table-cell">
          {date}
        </td>
        <td className="w-2/5 py-4 pr-4 text-left lg:table-cell lg:w-2/12">
          <div className="flex w-full">
            {!isDesktop && getCategoryIcon()}
            <div className="flex flex-col items-start justify-start">
              <span className="text-sm font-semibold text-miru-dark-purple-1000 lg:text-base">
                {vendorName}
              </span>
              <p className="truncateOverflowText text-xs font-medium text-miru-dark-purple-400 lg:text-sm">
                {description}
              </p>
            </div>
          </div>
        </td>
        <td className="w-1/5 truncate whitespace-nowrap py-4 pr-4 text-left capitalize lg:table-cell lg:w-2/12">
          <div className="flex h-full flex-col items-start">
            <span className="font-semibold lg:font-medium">{expenseType}</span>
            <dl className="truncate text-left text-sm font-medium leading-5 text-miru-dark-purple-400 lg:hidden">
              <dt className="mt-1">{date}</dt>
            </dl>
          </div>
        </td>
        <td className="relative w-1/5 whitespace-nowrap py-4 pl-4 text-sm lg:w-2/12 lg:pr-2 lg:text-xl lg:font-bold">
          <div className="flex items-center">
            {receipts?.length > 0 && isDesktop && (
              <InvoicesIcon size={24} weight="bold" />
            )}
            <span className="flex w-full justify-end">
              {currencyFormat(currency, amount)}
            </span>
            {isDesktop && (
              <MoreOptions
                expense={expense}
                isDesktop={isDesktop}
                setShowMoreOptions={setShowMoreOptions}
                showMoreOptions={showMoreOptions}
              />
            )}
          </div>
        </td>
        <td className="w-1/6 text-center lg:hidden">
          <DotsThreeVerticalIcon
            className="mx-auto font-bold text-miru-dark-purple-1000"
            size={20}
            weight="bold"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowMoreOptions(true);
            }}
          />
        </td>
      </tr>
      {showMoreOptions && !isDesktop && (
        <MoreOptions
          expense={expense}
          isDesktop={isDesktop}
          setShowMoreOptions={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
    </Fragment>
  );
};

export default TableRow;
