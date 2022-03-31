import * as React from "react";

import BannerBox from "./BannerBox";
import Table from "./Table";

const Container = ({ invoiceList, setInvoiceList }) => {

  const handleSelectAll = (isChecked) => {
    const newInvoiceList = invoiceList.map((invoice) => ({ ...invoice, isChecked }));
    setInvoiceList(newInvoiceList);
  };

  const handleSelectCheckbox = (id, isChecked) => {
    const newInvoiceList = invoiceList.map((invoice) => {
      if (invoice.id === id) {
        return { ...invoice, isChecked: isChecked };
      }
      return { ...invoice };
    });
    setInvoiceList(newInvoiceList);
  };

  return (
    <React.Fragment>
      <ul className="page-display__wrap">
        <BannerBox title="OVERDUE" value="$35.5k" />
        <BannerBox title="OUTSTANDING" value="$24.3k" />
        <BannerBox title="AMOUNT IN DRAFT" value="$24.5k" />
      </ul>
      <div>
        <Table  handleSelectAll={handleSelectAll} handleSelectCheckbox={handleSelectCheckbox} updatedInvoiceList={invoiceList} />
      </div>
    </React.Fragment>
  );
};

export default Container;
