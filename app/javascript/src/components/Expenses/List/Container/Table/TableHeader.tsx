import React from "react";

import { i18n } from "../../../../../i18n";

const TableHeader = () => (
  <thead>
    <tr>
      <th
        className="hidden w-3/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-foreground lg:table-cell"
        scope="col"
      >
        {i18n.t("expenses.category").toUpperCase()}
      </th>
      <th
        className="hidden w-2/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-foreground lg:table-cell"
        scope="col"
      >
        {i18n.t("tableHeaders.date")}
      </th>
      <th
        className="hidden w-3/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-foreground lg:table-cell"
        scope="col"
      >
        {i18n.t("expenses.vendorDescription")}
      </th>
      <th
        className="hidden w-2/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-foreground lg:table-cell"
        scope="col"
      >
        {i18n.t("tableHeaders.type")}
      </th>
      <th
        className="table-cell w-2/5 py-5 pr-4 text-left text-xs font-medium tracking-widest text-foreground lg:hidden"
        scope="col"
      >
        {i18n.t("expenses.category").toUpperCase()} /{" "}
        {i18n.t("expenses.vendor").toUpperCase()}
      </th>
      <th
        className="table-cell w-1/5 py-5 pr-4 text-left text-xs font-medium tracking-widest text-foreground lg:hidden"
        scope="col"
      >
        {i18n.t("tableHeaders.type")} / {i18n.t("tableHeaders.date")}
      </th>
      <th
        className="w-1/5 py-5 pl-4 text-right text-xs font-medium tracking-widest text-foreground lg:w-2/12 lg:pl-8"
        scope="col"
      >
        {i18n.t("tableHeaders.amount")}
      </th>
    </tr>
  </thead>
);

export default TableHeader;
