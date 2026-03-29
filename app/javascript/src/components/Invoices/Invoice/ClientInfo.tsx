import React from "react";

const ClientInfo = ({ client }) => {
  const { address_line_1, address_line_2, city, state, country, pin } =
    client?.address ?? {};

  return (
    <div className="relative w-full rounded border border-border bg-muted px-4 py-3 lg:mr-4 lg:w-4/12">
      <p className="absolute left-2 -top-2 bg-muted px-2 text-xs font-medium text-foreground">
        Billed to
      </p>
      <div className="h-full overflow-y-auto">
        <p className="text-xl font-bold leading-7 text-foreground">
          {client.name}
        </p>
        <p className="w-full text-sm font-normal text-muted-foreground lg:w-52">
          {client?.address
            ? `${address_line_1}${
                address_line_2 ? `, ${address_line_2}` : ""
              }\n${
                address_line_2 ? "," : ""
              }\n${city}, ${state}, ${country},\n${pin}`
            : "No address found"}
          <br />
          {client.phone}
        </p>
      </div>
    </div>
  );
};

export default ClientInfo;
