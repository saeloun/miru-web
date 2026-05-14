import React from "react";
import { i18n } from "../../../i18n";

const ClientInfo = ({ client }) => {
  const { address_line_1, address_line_2, city, state, country, pin } =
    client?.address ?? {};
  const clientEin = client?.ein;

  return (
    <div className="relative w-full rounded border border-border bg-muted px-4 py-3 lg:mr-4 lg:w-4/12">
      <p className="absolute left-2 -top-2 bg-muted px-2 text-xs font-medium text-foreground">
        {i18n.t("invoices.billedTo")}
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
            : i18n.t("noResultsFound")}
          <br />
          {clientEin && (
            <>
              {i18n.t("invoices.ein", { value: clientEin })}
              <br />
            </>
          )}
          {client.phone}
        </p>
      </div>
    </div>
  );
};

export default ClientInfo;
