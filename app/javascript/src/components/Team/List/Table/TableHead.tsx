import React, { Fragment } from "react";

import { useUserContext } from "context/UserContext";

const TableHead = () => {
  const { isAdminUser } = useUserContext();

  return (
    <thead className=" border-miru-gray-200" data-cy="team-table-header">
      <tr>
        <th className="table__header p-6" scope="col">
          NAME
        </th>
        <th className="table__header p-6" scope="col">
          EMAIL ID
        </th>
        <th className="table__header p-6" scope="col">
          ROLE
        </th>
        <th className="table__header p-6" scope="col">
          FIXED WORKING HOURS
        </th>
        <th className="table__header p-6" scope="col">
          BALANCE PTO
        </th>
        {isAdminUser && (
          <Fragment>
            <th className="table__header p-6" scope="col" />
            <th className="table__header p-6" scope="col" />
          </Fragment>
        )}
      </tr>
    </thead>
  );
};

export default TableHead;
