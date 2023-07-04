import React from "react";

import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";

import CustomCheckbox from "common/CustomCheckbox";
import getStatusCssClass from "utils/getBadgeStatus";

const InvoicesList = ({
  isSelected,
  deselectInvoices,
  selectInvoices,
  invoice,
}) => {
  const { amount, company, id, invoiceNumber, status } = invoice;

  const { baseCurrency } = company;

  const handleCheckboxChange = () => {
    if (isSelected) {
      deselectInvoices([id]);
    } else {
      selectInvoices([id]);
    }
  };

  return (
    <tr>
      <td className="px-0 py-0">
        <CustomCheckbox
          isUpdatedDesign
          checkboxValue={isSelected}
          handleCheck={handleCheckboxChange}
          handleOnClick={e => e.stopPropagation()}
          id={id}
          isChecked={isSelected}
          text=""
          wrapperClassName="h-8 w-8 m-auto rounded-3xl p-2 hover:bg-miru-gray-1000"
        />
      </td>
      <td>{invoiceNumber}</td>
      <td className="hidden px-2 text-right text-sm font-bold tracking-normal text-miru-dark-purple-1000 lg:table-cell lg:w-1/6 lg:px-6 lg:pt-2 lg:pb-7 lg:text-xl">
        {currencyFormat(baseCurrency, amount)}
      </td>
      <td className="relative px-2 text-right font-medium lg:px-6 lg:pb-10">
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

export default InvoicesList;
