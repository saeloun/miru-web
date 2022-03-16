import * as React from "react";
import InvoiceTable from "./InvoiveTable";
import SubComp1 from "./SubComp1";
import SubComp2 from "./SubComp2";
import SubComp4 from "./SubComp4";

const Container = () => {
  return (
    <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
      <SubComp1 />
      <SubComp2 />
      <div className="px-10 py-5">
        <InvoiceTable />
      </div>
      <SubComp4 />
    </div>
  );
};

export default Container;
