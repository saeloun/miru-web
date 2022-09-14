import React from "react";

import { useList } from "context/TeamContext";

import TableHead from "./TableHead";
import TableRow from "./TableRow";

const Table = () => {
  const { teamList } = useList();
  return (
    <table className="table__width">
      <TableHead />
      <tbody>
        {
          teamList.map((user, index) => (
            <TableRow key={index} user={user} />
          ))
        }
      </tbody>
    </table>
  );
};
export default Table;
