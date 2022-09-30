import React, { Fragment } from "react";

import { useUserContext } from "context/UserContext";

const TableHead = () => {
  const { isAdminUser } = useUserContext();
  return (
    <thead  className=" border-miru-gray-200" data-cy="team-table-header">
      <tr>
        <th scope="col" className="table__header p-6">
          NAME
        </th>
        <th scope="col" className="table__header p-6">
          EMAIL ID
        </th>
        <th scope="col" className="table__header p-6">
          ROLE
        </th>
        <th scope="col" className="table__header p-6">
          DEPARTMENT
        </th>
        <th scope="col" className="table__header p-6">
          TEAM LEAD
        </th>
        {isAdminUser &&
          <Fragment>
            <th scope="col" className="table__header p-6">
            </th>
            <th scope="col" className="table__header p-6">
            </th>
          </Fragment>
        }
      </tr>
    </thead>
  );
};

export default TableHead;
