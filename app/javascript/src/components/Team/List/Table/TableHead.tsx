import React from "react";

import { i18n } from "../../../../i18n";

const TableHead = () => (
  <thead className="border-border lg:grid">
    <tr className="flex lg:grid lg:grid-cols-10 lg:gap-4">
      <th className="w-3/5 py-2 text-left text-xs font-medium leading-4 tracking-widest text-muted-foreground lg:col-span-4 lg:py-5">
        {i18n.t("tableHeaders.user")}
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-muted-foreground lg:table-cell lg:py-5">
        {i18n.t("tableHeaders.salary")}
      </th>
      <th className="w-2/5 py-2 text-left text-xs font-medium leading-4 tracking-widest text-muted-foreground lg:col-span-2 lg:py-5">
        {i18n.t("tableHeaders.role")}
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-muted-foreground lg:table-cell lg:py-5">
        {i18n.t("tableHeaders.type")}
      </th>
    </tr>
  </thead>
);
export default TableHead;
