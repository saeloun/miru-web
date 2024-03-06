import React, { Fragment } from "react";

import EmptyStates from "common/EmptyStates";
import { useList } from "context/TeamContext";

import TableHead from "./TableHead";
import TableRow from "./TableRow";

const Table = () => {
  const { teamList } = useList();

  return (
    <Fragment>
      {teamList.length > 0 ? (
        <table className="table__width grid pb-14">
          <TableHead />
          <tbody>
            {teamList.map((item, index) => (
              <TableRow item={item} key={index} />
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyStates
          showNoSearchResultState
          Message="No team member(s) found"
        />
      )}
    </Fragment>
  );
};
export default Table;
