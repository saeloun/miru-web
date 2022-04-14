import React, { useState } from "react";

import CompanyInfo from "./CompanyInfo";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceTotal from "./InvoiceTotal";
import InvoiceTable from "./InvoiveTable";

const Container = ({ invoiceDetails }) => {

  const [selectedClient, setSelectedClient] = useState<any>();
  const [selectedOption, setSelectedOption] = useState<any>([]);

  return (
    <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
      <CompanyInfo companyDetails={invoiceDetails.companyDetails}/>
      <InvoiceDetails selectedClient={selectedClient} setSelectedClient= {setSelectedClient} clientList = {invoiceDetails.clientList}/>
      <div className="px-10 py-5">
        <InvoiceTable
          selectedClient ={selectedClient}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
      </div>
      <InvoiceTotal
        newLineItems={selectedOption}
      />
    </div>
  );
};

export default Container;
