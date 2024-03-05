import React from "react";

import { useList } from "context/TeamContext";

import TableHead from "./TableHead";
import TableRow from "./TableRow";

const Table = () => {
  const { teamList } = useList();

  return (
    <table className="table__width grid pb-14">
      <TableHead />
      <tbody>
        {teamList.map((item, index) => (
          <TableRow item={item} key={index} />
        ))}
      </tbody>
    </table>
  );
};
export default Table;
