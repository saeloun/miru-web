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
  const [newLineItems, setNewLineItems] = useState<Array<any>>([]);
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
        />
      </div>
      <InvoiceTotal
        newLineItems={selectedOption}
        setAmountDue={setAmountDue}
        amountDue={amountDue}
      />
      {showMultilineModal &&
        <MultipleEntriesModal
          newLineItems={newLineItems}
          setNewLineItems={setNewLineItems}
          setShowMultilineModal={setShowMultilineModal}
        />
      }
    </div>
  );
};
export default Container;
