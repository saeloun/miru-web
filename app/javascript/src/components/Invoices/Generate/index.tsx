import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import generateInvoice from "apis/generateInvoice";

import Container from "./Container";
import Header from "./Header";
import { unmapGenerateInvoice } from "../../../mapper/generateInvoice.mapper";

const fetchGenerateInvoice = async (navigate, getInvoiceDetails) => {
  try {
    const res = await generateInvoice.get();
    const sanitzed = await unmapGenerateInvoice(res.data);
    getInvoiceDetails(sanitzed);

  } catch (e) {
    navigate("invoices/error");
    return {};
  }
};

const GenerateInvoices = () => {
  const navigate = useNavigate();
  const [invoiceDetails, getInvoiceDetails] = useState<any>();

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchGenerateInvoice(navigate, getInvoiceDetails);
  }, []);

  if (invoiceDetails) {
    return (
      <React.Fragment>
        <Header />
        <Container invoiceDetails={invoiceDetails} />
      </React.Fragment>
    );
  }
  return <></>;
};

export default GenerateInvoices;
