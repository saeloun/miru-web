import React from "react";

import CustomCheckbox from "common/CustomCheckbox";
import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const InvoicesList = ({
  isSelected,
  deselectInvoices,
  selectInvoices,
  invoice,
}) => {
  const { amount, company, id, invoiceNumber, status, issueDate, dueDate } =
    invoice;

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
      <td className="w-1/4 px-0 py-0 lg:px-2 lg:text-base">{invoiceNumber}</td>
      <td className="w-1/4 px-0 py-0 lg:text-base">{issueDate}</td>
      <td className="px-0 py-0 lg:text-base">{dueDate}</td>
      <td className="w-1/5 px-0 text-right text-base tracking-normal text-miru-dark-purple-1000 lg:w-1/6 lg:px-3 lg:pt-2 lg:pb-7 lg:text-base">
        {currencyFormat(baseCurrency, amount)}
      </td>
      <td className="w-1/6 px-2 text-right font-medium lg:pb-10">
        <Badge
          className={`${getStatusCssClass(status)} mt-4 uppercase`}
          text={status}
        />
      </td>
    </tr>
  );
};

export default InvoicesList;
