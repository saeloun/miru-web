import React from "react";

import { i18n } from "../../../../i18n";

const TableHeader = () => (
  <thead>
    <tr className="grid w-full grid-cols-[minmax(8rem,1.15fr)_minmax(12rem,1.9fr)_minmax(6rem,0.85fr)] gap-4 border-b border-border px-4 py-3">
      <th className="text-left text-xs font-normal tracking-widest text-muted-foreground">
        {i18n.t("tableHeaders.date")}
      </th>
      <th className="text-left text-xs font-normal tracking-widest text-muted-foreground">
        {i18n.t("tableHeaders.description")}
      </th>
      <th className="text-right text-xs font-normal tracking-widest text-muted-foreground">
        {i18n.t("hours").toUpperCase()}
      </th>
    </tr>
  </thead>
);

export default TableHeader;
