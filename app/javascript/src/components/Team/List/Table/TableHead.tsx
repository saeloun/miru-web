import React, { Fragment } from "react";

import { useUserContext } from "context/UserContext";

const TableHead = () => {
  const { isAdminUser, isDesktop } = useUserContext();

  if (isDesktop) {
    return (
      <thead className=" border-miru-gray-200">
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
          {isAdminUser && (
            <Fragment>
              <th className="table__header p-6" scope="col" />
              <th className="table__header p-6" scope="col" />
            </Fragment>
          )}
        </tr>
      </thead>
    );
  }

  return (
    <thead className=" border-miru-gray-200">
      <tr>
        <th className="table__header w-1/2 p-6" scope="col">
          NAME / EMAIL ID
        </th>
        <th className="table__header w-1/3 p-6 text-right" scope="col">
          ROLE
        </th>
        <th className="table__header" scope="col" />
      </tr>
    </thead>
  );
};

export default TableHead;
