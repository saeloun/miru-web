import React from "react";
import { i18n } from "../../../../i18n";

const LineItemTableHeader = () => (
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {i18n.t("name")}
      </th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {i18n.t("date")}
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {i18n.t("invoices.rate")}
      </th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {i18n.t("invoices.quantity")}
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {i18n.t("total")}
      </th>
      <th className="px-4 py-3 w-10" />
    </tr>
  </thead>
);

export default LineItemTableHeader;
