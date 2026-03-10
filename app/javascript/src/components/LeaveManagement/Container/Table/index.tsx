import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ timeoffEntries = [] }) => (
  <table className="mt-4 min-w-full">
    <TableHeader />
    <tbody className="flex flex-col bg-card">
      {timeoffEntries?.length ? (
        timeoffEntries.map((timeoffEntry, index) => (
          <TableRow key={index} timeoffEntry={timeoffEntry} />
        ))
      ) : (
        <tr className="tracking-wide flex items-center justify-center text-base font-medium text-primary md:h-50">
          <td>No Data Found</td>
        </tr>
      )}
    </tbody>
  </table>
);

export default Table;
