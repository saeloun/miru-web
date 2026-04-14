import React from "react";

import CustomCheckbox from "common/CustomCheckbox";
import { i18n } from "../../../../../i18n";

const MobileTableHeader = ({ handleCheck, isChecked }) => (
  <thead>
    <tr>
      <th className="w-1/10 pt-4" scope="col">
        <CustomCheckbox
          isUpdatedDesign
          checkboxValue={1}
          handleCheck={handleCheck}
          id={1}
          isChecked={isChecked}
          text=""
          wrapperClassName="h-8 m-auto rounded-3xl"
        />
      </th>
      <th
        className="w-1/5 py-5 text-left text-xs font-medium tracking-widest text-foreground"
        scope="col"
      >
        {i18n.t("tableHeaders.invoiceNumber")}
      </th>
      <th
        className="w-1/5 py-5 text-left text-xs font-medium tracking-widest text-foreground"
        scope="col"
      >
        {i18n.t("tableHeaders.issueDateDueDate")}
      </th>
      <th
        className="w-1/5 px-4 py-5 text-right text-xs font-medium tracking-widest text-foreground"
        scope="col"
      >
        {i18n.t("tableHeaders.statusAmount")}
      </th>
    </tr>
  </thead>
);

export default MobileTableHeader;
