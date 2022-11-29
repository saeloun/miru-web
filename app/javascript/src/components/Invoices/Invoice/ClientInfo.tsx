import React from "react";

const ClientInfo = ({ client }) => (
  <div className="group">
    <p className="flex text-xs font-normal text-miru-dark-purple-1000">
      Billed to
    </p>
    <div>
      <p className="text-base font-bold text-miru-dark-purple-1000">
        {client.name}
      </p>
      <p className="w-52 text-xs font-normal text-miru-dark-purple-400">
        {client.address}
        <br />
        {client.phone}
      </p>
    </div>
  </div>
);

export default ClientInfo;
