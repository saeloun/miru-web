import React from "react";

import RecentlyUpdatedCard from "./RecentlyUpdatedCard";

const RecentlyUpdated = ({ recentlyUpdatedInvoices }) => (
  <div className="my-20">
    <h1 className="mb-4 text-2xl font-normal text-miru-dark-purple-1000">
      Recently updated
    </h1>
    <div className="grid grid-cols-10 gap-44 overflow-x-auto overflow-y-hidden">
      {recentlyUpdatedInvoices.length > 0 ? (
        recentlyUpdatedInvoices.map(invoice => (
          <RecentlyUpdatedCard invoice={invoice} key={invoice.id} />
        ))
      ) : (
        <span className="col-span-5 grid text-xl font-medium text-miru-dark-purple-200">
          No Recently Updated invoices available.
        </span>
      )}
    </div>
  </div>
);

export default RecentlyUpdated;
