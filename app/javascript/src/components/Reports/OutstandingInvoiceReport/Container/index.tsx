import React from "react";

import { SummaryDashboard } from "StyledComponents";

import EmptyStates from "common/EmptyStates";
import { useEntry } from "components/Reports/context/EntryContext";
import { useUserContext } from "context/UserContext";

import Table from "./Table";

const Container = () => {
  const { outstandingOverdueInvoice } = useEntry();
  const { isDesktop } = useUserContext();

  const summaryList = isDesktop
    ? [
        {
          label: "TOTAL OUTSTANDING",
          value: outstandingOverdueInvoice.summary.totalOutstandingAmount,
        },
        {
          label: "TOTAL OVERDUE",
          value: outstandingOverdueInvoice.summary.totalOverdueAmount,
        },
        {
          label: "TOTAL INVOICE AMOUNT",
          value: outstandingOverdueInvoice.summary.totalInvoiceAmount,
        },
      ]
    : [
        {
          label: "OUTSTANDING",
          value: outstandingOverdueInvoice.summary.totalOutstandingAmount,
        },
        {
          label: "OVERDUE",
          value: outstandingOverdueInvoice.summary.totalOverdueAmount,
        },
      ];

  return outstandingOverdueInvoice.clientList.length > 0 ? (
    outstandingOverdueInvoice.currency && (
      <div className="bg-white p-4 lg:p-0">
        <SummaryDashboard
          currency={outstandingOverdueInvoice.currency}
          showPointer={false}
          summaryList={summaryList}
          wrapperClassName="lg:mt-3 lg:mb-9"
        />
        <div>
          <Table outstandingOverdueInvoice={outstandingOverdueInvoice} />
        </div>
      </div>
    )
  ) : (
    <EmptyStates
      showNoSearchResultState={outstandingOverdueInvoice.filterCounter > 0}
      Message={
        outstandingOverdueInvoice.filterCounter > 0
          ? "No results match current filters. Try removing some filters."
          : "There are no invoices yet. Please go to Invoices to generate invoices."
      }
    />
  );
};

export default Container;
