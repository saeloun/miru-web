import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const RecentlyUpdatedCard = ({
  invoice: { client, id, invoiceNumber, amount, status },
  index,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`${
        index == 0 ? "mr-1 lg:mr-2" : "mx-1 lg:mx-2"
      } flex h-auto w-40 cursor-pointer flex-col justify-between rounded-xl border-2 border-miru-gray-200 p-4 text-center hover:shadow-c1`}
      onClick={() => navigate(`/invoices/${id}`)}
    >
      <h3 className="mr-0.5 text-center text-xs font-normal text-miru-dark-purple-400">
        {invoiceNumber}
      </h3>
      <div className="my-1 flex justify-center lg:my-3">
        <Avatar url={client.logo} />
      </div>
      <div className="my-2 flex h-9 items-center justify-center text-center text-sm font-semibold capitalize leading-5 text-miru-dark-purple-1000 lg:mt-1 lg:mb-2.5 lg:h-11 lg:text-base">
        <p className="truncateOverflowText">{client.name}</p>
      </div>
      <h1 className="mb-2 truncate text-base font-bold text-miru-dark-purple-1000 lg:text-xl">
        {currencyFormat(client.clientCurrency, amount)}
      </h1>
      <div>
        <Badge
          className={`${getStatusCssClass(status)} mt-2 uppercase`}
          text={status}
        />
      </div>
    </div>
  );
};

export default RecentlyUpdatedCard;
