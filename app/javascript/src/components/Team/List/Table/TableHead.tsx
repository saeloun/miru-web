import React, { Fragment } from "react";
import { useUserContext } from "context/UserContext";

const TableHead = () => {
  const { isAdminUser } = useUserContext();
  return (
    <thead className="" data-cy="team-table-header  border-miru-gray-200">
      <tr>
        <th scope="col" className="table__header p-6">
          PHOTO
        </th>
        <th scope="col" className="table__header p-6">
          NAME
        </th>
        <th scope="col" className="table__header p-6">
          EMAIL ID
        </th>
        <th scope="col" className="table__header p-6">
          ROLE
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
