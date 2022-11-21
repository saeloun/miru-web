import React from "react";

const ClientInfo = ({ client }) => (
  <div className="group">
    <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
      Billed to
    </p>
    <div>
      <p className="font-bold text-base text-miru-dark-purple-1000">
        {client.name}
      </p>
      <p className="font-normal text-xs text-miru-dark-purple-400 w-52">
        {client.address}
        <br />
        {client.phone}
      </p>
    </div>
  </div>
);

export default ClientInfo;
