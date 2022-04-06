import React, { useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import Container from "./Container";
import Header from "./Header";

const GenerateInvoices = () => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <React.Fragment>
      <Header />
      <Container />
    </React.Fragment>
  );
};

export default GenerateInvoices;
