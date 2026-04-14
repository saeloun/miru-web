import React from "react";
import { i18n } from "../../../i18n";

const TableHeader = () => (
  <tr>
    <th
      className="whitespace-nowrap py-5 pr-4 pl-0 text-left text-xs font-medium tracking-widest text-foreground w-[25%] lg:pr-2"
      scope="col"
    >
      {i18n.t("payments.invoiceClient")}
    </th>
    <th
      className="w-[20%] px-4 py-5 text-left text-xs font-medium tracking-widest text-foreground lg:px-6"
      scope="col"
    >
      {i18n.t("payments.dateType")}
    </th>
    <th
      className="w-[25%] px-2 py-5 text-left text-xs font-medium tracking-widest text-foreground lg:px-6"
      scope="col"
    >
      {i18n.t("payments.notes")}
    </th>
    <th
      className="w-[15%] px-2 py-5 text-right text-xs font-medium tracking-widest text-foreground lg:px-6"
      scope="col"
    >
      {i18n.t("amount").toUpperCase()}
    </th>
    <th
      className="w-[15%] px-2 py-5 text-right text-xs font-medium tracking-widest text-foreground lg:px-6"
      scope="col"
    >
      {i18n.t("status").toUpperCase()}
    </th>
  </tr>
);

export default TableHeader;
