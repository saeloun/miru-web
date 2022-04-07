import React, { useState } from "react";

import CompanyInfo from "./CompanyInfo";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceTotal from "./InvoiceTotal";
import InvoiceTable from "./InvoiveTable";

const Container = () => {

  const [newLineItems, setNewLineItems] = useState<Array<any>>([]);

  return (
    <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
      <CompanyInfo />
      <InvoiceDetails />
      <div className="px-10 py-5">
        <InvoiceTable
          newLineItems={newLineItems}
          setNewLineItems={setNewLineItems}
        />
      </div>
      <InvoiceTotal
        newLineItems={newLineItems}
      />
    </div>
  );
};

export default Container;
