import React, { Fragment } from "react";

import RecentlyUpdatedCard from "./RecentlyUpdatedCard";

const RecentlyUpdated = ({ recentlyUpdatedInvoices }) => (
  <div className="mt-8 mb-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
          Recently Updated
        </h2>
        {recentlyUpdatedInvoices?.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {recentlyUpdatedInvoices.length} invoices
          </span>
        )}
      </div>
    </div>
    <div className="flex overflow-x-auto overflow-y-visible pb-4 -mx-2">
      <div className="flex px-2">
        {recentlyUpdatedInvoices.length > 0 ? (
          recentlyUpdatedInvoices.map((invoice, index) => (
            <Fragment key={invoice.id}>
              {index <= 9 && (
                <RecentlyUpdatedCard
                  index={index}
                  invoice={invoice}
                  key={invoice.id}
                />
              )}
            </Fragment>
          ))
        ) : (
          <div className="w-full py-12 text-center">
            <p className="text-sm text-gray-500">
              No recently updated invoices
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default RecentlyUpdated;
