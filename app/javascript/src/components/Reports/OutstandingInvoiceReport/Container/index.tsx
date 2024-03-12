import React from "react";

import { SummaryDashboard } from "StyledComponents";

import EmptyStates from "common/EmptyStates";
import { useEntry } from "components/Reports/context/EntryContext";
import { useUserContext } from "context/UserContext";

import Table from "./Table";

import { getSummaryList } from "../utils";

const Container = () => {
  const { outstandingOverdueInvoice } = useEntry();
  const { isDesktop } = useUserContext();

  if (outstandingOverdueInvoice?.clientList?.length <= 0) {
    return (
      <EmptyStates
        showNoSearchResultState={outstandingOverdueInvoice.filterCounter > 0}
        Message={
          outstandingOverdueInvoice.filterCounter > 0
            ? "No results match current filters. Try removing some filters."
            : "There are no invoices yet. Please go to Invoices to generate invoices."
        }
      />
    );
  }

  return (
    <>
      {outstandingOverdueInvoice.currency && (
        <div className="bg-white p-4 lg:p-0">
          <SummaryDashboard
            showPointer={false}
            currency={outstandingOverdueInvoice.currency}
            summaryList={getSummaryList(isDesktop, outstandingOverdueInvoice)}
            wrapperClassName="lg:mt-3 lg:mb-9"
          />
          <div>
            <Table outstandingOverdueInvoice={outstandingOverdueInvoice} />
          </div>
        </div>
      )}
    </>
  );
};

export default Container;
