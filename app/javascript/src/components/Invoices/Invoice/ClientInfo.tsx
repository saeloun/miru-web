import React from "react";

const ClientInfo = ({ client }) => (
  <div className="relative mr-4 w-4/12 rounded border border-miru-gray-400 bg-miru-gray-100 px-4 py-3">
    <p className="absolute left-2 -top-2 bg-miru-gray-100 px-2 text-xs font-medium text-miru-dark-purple-1000">
      Billed to
    </p>
    <div>
      <p className="text-xl font-bold leading-7 text-miru-dark-purple-1000">
        {client.name}
      </p>
      <p className="w-52 text-sm font-normal text-miru-dark-purple-600">
        {client.address}
        <br />
        {client.phone}
      </p>
    </div>
  </div>
);

export default ClientInfo;
