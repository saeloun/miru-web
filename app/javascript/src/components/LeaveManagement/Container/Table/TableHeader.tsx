import React from "react";

import { i18n } from "../../../../i18n";

const TableHeader = () => (
  <thead>
    <tr className="flex w-full justify-between">
      <th className="flex text-left text-xs font-normal tracking-widest text-muted-foreground lg:w-1/4">
        {i18n.t("tableHeaders.date")}
      </th>
      <th className="flex w-3/6 text-left text-xs font-normal tracking-widest text-muted-foreground lg:w-4/12">
        {i18n.t("tableHeaders.description")}
      </th>
      <th className="flex justify-end text-xs font-normal tracking-widest text-muted-foreground lg:w-3/12">
        {i18n.t("hours").toUpperCase()}
      </th>
    </tr>
  </thead>
);

export default TableHeader;
