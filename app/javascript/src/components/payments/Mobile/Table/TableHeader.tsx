import React from "react";
import { i18n } from "../../../../i18n";

const TableHeader = () => (
  <tr className="block md:hidden">
    <th
      className="w-full pt-6 pb-2 pr-6 pl-0 text-left font-sans text-xs font-normal uppercase tracking-xs-widest text-muted-foreground"
      scope="col"
    >
      {i18n.t("client").toUpperCase()}/ <br />
      {i18n.t("invoices.invoiceNumber").toUpperCase()}
    </th>
    <th
      className="w-full pt-6 pb-2 pl-0 text-right font-sans text-xs font-normal uppercase tracking-xs-widest text-muted-foreground"
      scope="col"
    >
      {i18n.t("status").toUpperCase()}/ <br />
      {i18n.t("amount").toUpperCase()}
    </th>
  </tr>
);

export default TableHeader;
