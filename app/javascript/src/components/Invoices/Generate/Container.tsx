import React, { useState } from "react";

import CompanyInfo from "./CompanyInfo";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceTotal from "./InvoiceTotal";
import InvoiceTable from "./InvoiveTable";
import MultipleEntriesModal from "./MultipleEntriesModal";

const Container = ({ invoiceDetails }) => {

  const [selectedClient, setSelectedClient] = useState<any>();
  const [selectedOption, setSelectedOption] = useState<any>([]);
  const [amountDue, setAmountDue] = useState<number>(0);
  const [lineItems, setLineItems] = useState<any>([]);
  const [showMultilineModal, setShowMultilineModal] = useState<boolean>(false);

  return (
    <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
      <CompanyInfo companyDetails={invoiceDetails.companyDetails}/>
      <InvoiceDetails amountDue={amountDue} selectedClient={selectedClient} setSelectedClient= {setSelectedClient} clientList = {invoiceDetails.clientList}/>
      <div className="px-10 py-5">
        <InvoiceTable
          selectedClient ={selectedClient}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          setShowMultilineModal={setShowMultilineModal}
          lineItems={lineItems}
          setLineItems={setLineItems}
        />
      </div>
      <InvoiceTotal
        newLineItems={selectedOption}
        setAmountDue={setAmountDue}
        amountDue={amountDue}
      />
      {showMultilineModal &&
        <MultipleEntriesModal
          lineItems={lineItems}
          setLineItems={setLineItems}
          setShowMultilineModal={setShowMultilineModal}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
      }
    </div>
  );
};
export default Container;
