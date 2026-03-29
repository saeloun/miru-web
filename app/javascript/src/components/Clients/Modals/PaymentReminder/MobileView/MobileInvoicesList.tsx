import React from "react";

import CustomCheckbox from "common/CustomCheckbox";
import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const MobileInvoicesList = ({
  deselectInvoices,
  invoice,
  isSelected,
  selectInvoices,
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
      <td className="w-1/12 py-3">
        <CustomCheckbox
          isUpdatedDesign
          checkboxValue={isSelected}
          handleCheck={handleCheckboxChange}
          handleOnClick={e => e.stopPropagation()}
          id={id}
          isChecked={isSelected}
          text=""
          wrapperClassName="h-8 w-8 m-auto rounded-3xl p-2"
        />
      </td>
      <td className="w-1/5 break-all px-2 py-0">{invoiceNumber}</td>
      <td className="w-1/5 px-0 py-0">
        {issueDate} <br />
        <span className="text-muted-foreground">{dueDate}</span>
      </td>
      <td className="w-1/5 px-4 text-right text-base tracking-normal text-foreground">
        <Badge
          className={`${getStatusCssClass(status)} mt-4 uppercase`}
          text={status}
        />
        {currencyFormat(baseCurrency, amount)}
      </td>
    </tr>
  );
};

export default MobileInvoicesList;
