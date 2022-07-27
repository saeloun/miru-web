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
          teamList.map((item, index) => (
            <TableRow key={index} item={item} />
          ))
        }
      </tbody>
    </table>
  );
};
export default Table;
