import React from "react";

import { i18n } from "../../../../i18n";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ timeoffEntries = [] }) => (
  <table className="mt-4 min-w-full">
    <TableHeader />
    <tbody className="divide-y divide-border bg-card">
      {timeoffEntries?.length ? (
        timeoffEntries.map((timeoffEntry, index) => (
          <TableRow key={index} timeoffEntry={timeoffEntry} />
        ))
      ) : (
        <tr className="flex items-center justify-center py-8 text-base font-medium tracking-wide text-primary">
          <td>{i18n.t("reports.noDataFound")}</td>
        </tr>
      )}
    </tbody>
  </table>
);

export default Table;
