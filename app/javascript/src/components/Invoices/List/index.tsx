import * as React from "react";
import Pagination from "common/Pagination";

import Container from "./container";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

// Should be removed once we start integrating with API.
const invoiceArray = [{
  id: 1,
  invoiceName: "Amazon",
  invoiceId: "6335 7871",
  invoicedate: "23.12.2021",
  invoiceduedate: "Due on 23.12.2021",
  amount: "$948.55",
  status: "OVERDUE"
},{
  id: 2,
  invoiceName: "Microsoft",
  invoiceId: "6335 7871",
  invoicedate: "23.12.2021",
  invoiceduedate: "Due on 23.12.2021",
  amount: "$948.55",
  status: "DRAFT"
},{
  id: 3,
  invoiceName: "Netflix",
  invoiceId: "6335 7871",
  invoicedate: "23.12.2021",
  invoiceduedate: "Due on 23.12.2021",
  amount: "$948.55",
  status: "SENT"
},{
  id: 4,
  invoiceName: "Netflix",
  invoiceId: "6335 7871",
  invoicedate: "23.12.2021",
  invoiceduedate: "Due on 23.12.2021",
  amount: "$948.55",
  status: "VIEWED"
}];

const Invoices = () => {

  const [isFilterVisible, setFilterVisibilty] = React.useState<boolean>(false);
  const [isInvoiceSelected, setInvoiceSelection] = React.useState<boolean>(false);
  const [invoiceList, setInvoiceList] = React.useState<any>(invoiceArray);
  const [selectedInvoiceCount, setSelectedInvoiceCount] = React.useState<number>(0);

  const clearCheckboxes = () => {
    const newInvoiceList = invoiceArray.map((invoice) => ({ ...invoice, isChecked: false }));
    setInvoiceList(newInvoiceList);
  };

  React.useEffect(() => {
    clearCheckboxes();
  },[]);

  React.useEffect(() => {
    const selectedInvoiceList = invoiceList.filter(invoice => invoice.isChecked);
    setSelectedInvoiceCount(selectedInvoiceList.length);
    setInvoiceSelection(selectedInvoiceList.length>0);
  },[invoiceList]);

  return (
    <React.Fragment>
      <Header setFilterVisibilty={setFilterVisibilty} clearCheckboxes={clearCheckboxes} selectedInvoiceCount={selectedInvoiceCount} isInvoiceSelected={isInvoiceSelected} />
      <Container invoiceList={invoiceList} setInvoiceList = {setInvoiceList} />
      { isFilterVisible && <FilterSideBar setFilterVisibilty={setFilterVisibilty} /> }
      <Pagination />
    </React.Fragment>
  );
};

export default Invoices;
