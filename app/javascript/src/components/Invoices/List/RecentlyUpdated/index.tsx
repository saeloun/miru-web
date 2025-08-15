import React, { Fragment } from "react";

import RecentlyUpdatedCard from "./RecentlyUpdatedCard";

const RecentlyUpdated = ({ recentlyUpdatedInvoices }) => (
  <div className="mt-6 mb-4">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
        Recently Updated
      </h2>
      {recentlyUpdatedInvoices?.length > 0 && (
        <span className="text-xs text-gray-500">
          {recentlyUpdatedInvoices.length} invoices
        </span>
      )}
    </div>
    <div className="flex overflow-x-auto overflow-y-visible pb-2 -mx-1">
      <div className="flex">
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
          <div className="w-full py-8 text-center">
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
