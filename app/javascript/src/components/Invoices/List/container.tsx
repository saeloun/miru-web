import * as React from "react";

import AmountBoxContainer from "common/AmountBox";
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

  const amountBox = [{
    title: "OVERDUE",
    amount: "$35.5k"
  },
  {
    title: "OUTSTANDING",
    amount: "$24.3k"
  },
  {
    title: "AMOUNT IN DRAFT",
    amount: "$24.5k"
  }];

  return (
    <React.Fragment>
      <div className="bg-miru-gray-100 py-10 px-10">
        <AmountBoxContainer amountBox = {amountBox} cssClass="mt-0 border-none pt-0" />
      </div>
      <div>
        <Table  handleSelectAll={handleSelectAll} handleSelectCheckbox={handleSelectCheckbox} updatedInvoiceList={invoiceList} />
      </div>
    </React.Fragment>
  );
};

export default Container;
