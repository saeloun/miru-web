import * as React from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

const Invoices = () => {
  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <>
        <h1>Invoice Page React</h1>
    </>
  );
};

export default Invoices;
