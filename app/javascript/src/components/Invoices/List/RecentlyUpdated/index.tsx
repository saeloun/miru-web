import React, { Fragment } from "react";

import RecentlyUpdatedCard from "./RecentlyUpdatedCard";

const RecentlyUpdated = ({ recentlyUpdatedInvoices }) => (
  <div className="mt-4 mb-6 md:my-15">
    <h1 className="mb-4 text-base font-semibold text-miru-dark-purple-1000 lg:text-2xl lg:font-normal">
      Recently updated
    </h1>
    <div className="grid grid-cols-10 gap-44 overflow-x-auto overflow-y-hidden">
      {recentlyUpdatedInvoices.length > 0 ? (
        recentlyUpdatedInvoices.map((invoice, index) => (
          <Fragment key={invoice.id}>
            {index <= 5 && (
              <RecentlyUpdatedCard
                index={index}
                invoice={invoice}
                key={invoice.id}
              />
            )}
          </Fragment>
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
