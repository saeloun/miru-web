import React from "react";

import dayjs from "dayjs";
import { Avatar, Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const formattedDate = (date, format) => dayjs(date).format(format);

const RecentlyUpdated = ({ invoice }) => (
  <div key={invoice.id} className="p-4 mx-2 w-40 h-52 border-miru-gray-200 border-2 rounded-xl text-center">
    <div className="flex justify-center whitespace-nowrap">
      <h3 className="text-xs font-normal text-miru-dark-purple-400 mr-0.5">{invoice.invoiceNumber}</h3>
      <h3 className="text-xs font-semibold text-miru-dark-purple-400">{formattedDate(invoice.dueDate, invoice.company.dateFormat)}</h3>
    </div>
    <div className="flex justify-center md:my-3 my-1">
      <Avatar/>
    </div>
    <h1 className="mt-1 font-semibold md:text-base text-sm tracking-wider capitalize text-miru-dark-purple-1000">{invoice.client.name}</h1>
    <h1 className="mt-2.5 mb-1 md:text-xl text-base font-bold tracking-wider text-miru-dark-purple-1000"> {invoice.amount} </h1>
    <Badge
      text={invoice.status}
      className={`${getStatusCssClass(invoice.status)} uppercase mt-2`}
    />
  </div>
);

export default RecentlyUpdated;
