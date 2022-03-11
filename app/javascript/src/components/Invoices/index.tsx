import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import Body from "./Body";
import Header from "./Header";

const Invoices = () => {
  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <React.Fragment>
      <Header/>
      <Body/>
    </React.Fragment>
  );
};

export default Invoices;
