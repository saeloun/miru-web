import React from "react";
import Header from "../Header";

const OutstandingInvoiceReport = () => (
  <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
    <Header
      showNavFilters={true}
      setFilterVisibilty={true}
      isFilterVisible={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
      resetFilter={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
      handleDownload={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
      type={"Outstanding and Overdue Invoices"}
    />
    <div>
      {/** Container will be listed here */}
    </div>
  </div>
);

export default OutstandingInvoiceReport;
