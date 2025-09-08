import React, { Fragment, useState } from "react";

import DeleteExpenseModal from "components/Expenses/Modals/DeleteExpenseModal";
import { Categories } from "components/Expenses/utils";
import { useUserContext } from "context/UserContext";
import { currencyFormat } from "helpers";
import { DotsThreeVerticalIcon, ExpenseIconSVG, InvoicesIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import MoreOptions from "./MoreOptions";

const TableRow = ({ expense, currency, fetchExpenses }) => {
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
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] =
    useState<boolean>(false);

  const getCategoryIcon = () => {
    const icon = Categories.find(category => category.label === categoryName)
      ?.icon || <img src={ExpenseIconSVG} />;

    return (
      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-miru-gray-100 to-miru-gray-200 p-1.5 text-miru-dark-purple-600 lg:h-10 lg:w-10 lg:p-2">
        {icon}
      </div>
    );
  };

  const handleExpenseClick = id => {
    navigate(`${id}`);
  };

  const handleDelete = () => {
    setShowDeleteExpenseModal(true);
  };

  return (
    <Fragment>
      <tr
        className="group w-full cursor-pointer border-b border-miru-gray-200 last:border-b-0 hover:bg-miru-gray-50"
        key={id}
        onClick={() => handleExpenseClick(id)}
      >
        <td className="hidden py-5 lg:table-cell lg:w-3/12 lg:pr-8 lg:pl-2">
          <div className="flex items-center">
            {getCategoryIcon()}
            <div className="w-full overflow-hidden truncate whitespace-nowrap pr-2 text-sm font-semibold text-miru-dark-purple-1000 lg:text-base">
              {categoryName}
            </div>
          </div>
        </td>
        <td className="hidden w-2/12 py-5 pr-4 text-left text-xs font-normal text-miru-dark-purple-600 lg:table-cell lg:text-sm">
          {date}
        </td>
        <td className="w-2/5 py-5 pr-4 text-left lg:table-cell lg:w-2/12">
          <div className="flex w-full">
            {!isDesktop && getCategoryIcon()}
            <div className="flex flex-col items-start justify-start">
              <span className="text-sm font-semibold text-miru-dark-purple-1000 lg:text-base lg:leading-5">
                {vendorName}
              </span>
              <p className="truncateOverflowText text-xs font-normal text-miru-dark-purple-400 lg:text-sm lg:leading-4">
                {description || "—"}
              </p>
            </div>
          </div>
        </td>
        <td className="w-1/5 truncate whitespace-nowrap py-5 pr-4 text-left capitalize lg:table-cell lg:w-2/12">
          <div className="flex h-full flex-col items-start">
            <span className="text-xs font-medium text-miru-dark-purple-600 lg:text-sm">
              {expenseType}
            </span>
            <dl className="truncate text-left text-xs font-normal leading-4 text-miru-dark-purple-400 lg:hidden">
              <dt className="mt-1">{date}</dt>
            </dl>
          </div>
        </td>
        <td className="relative w-1/5 whitespace-nowrap py-5 pl-4 lg:w-2/12 lg:pr-2">
          <div className="flex items-center">
            {receipts?.length > 0 && isDesktop && (
              <InvoicesIcon
                className="text-miru-dark-purple-400"
                size={20}
                weight="bold"
              />
            )}
            <span className="flex w-full justify-end text-sm font-semibold text-miru-dark-purple-1000 lg:text-lg lg:font-bold">
              {currencyFormat(currency, amount)}
            </span>
            {isDesktop && (
              <MoreOptions
                expense={expense}
                handleDelete={handleDelete}
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
          handleDelete={handleDelete}
          isDesktop={isDesktop}
          setShowMoreOptions={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
      {showDeleteExpenseModal && (
        <DeleteExpenseModal
          expense={expense}
          fetchExpenses={fetchExpenses}
          setShowDeleteExpenseModal={setShowDeleteExpenseModal}
          showDeleteExpenseModal={showDeleteExpenseModal}
        />
      )}
    </Fragment>
  );
};

export default TableRow;
