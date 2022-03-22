
import * as React from "react";
import Pagination from "common/Pagination";

import Container from "./container";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

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
  const [updatedInvoiceList, setInvoiceList] = React.useState<any>(invoiceArray);
  const [selectedInvoiceCount, setSelectedInvoiceCount] = React.useState(0);
  React.useEffect(() => {
    const newInvoiceList = invoiceArray.map((invoice) => ({ ...invoice, isChecked: false }));
    setInvoiceList(newInvoiceList);
  },[]);

  React.useEffect(() => {
    const selectedInvoiceList = updatedInvoiceList.filter(invoice => {
      console.log(invoice.isChecked);
      return invoice.isChecked;
    });
    setSelectedInvoiceCount(selectedInvoiceList.length);
    setInvoiceSelection(selectedInvoiceList.length>0);
  },[updatedInvoiceList]);

  return (
    <React.Fragment>
      <Header setFilterVisibilty={setFilterVisibilty} selectedInvoiceCount={selectedInvoiceCount} isInvoiceSelected={isInvoiceSelected} />
      <Container invoiceList={updatedInvoiceList} setInvoiceList = {setInvoiceList} />
      { isFilterVisible && <FilterSideBar setFilterVisibilty={setFilterVisibilty} /> }
      <Pagination />
    </React.Fragment>
  );
};

export default Invoices;
