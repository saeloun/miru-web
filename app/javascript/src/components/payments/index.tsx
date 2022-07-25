import React, { useState } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import payment from "apis/payments/payments";
import Logger from "js-logger";
import Header from "./Header";
import AddManualEntry from "./Modals/AddManualEntry";
import Table from "./Table/index";
import { unmapPayment } from "../../mapper/payment.mapper";

const Payments = () => {

  const [showManualEntryModal, setShowManualEntryModal] = useState<boolean>(false);
  const [paymentList, setPaymentList] = useState<any>([]);
  const [invoiceList, setInvoiceList] = useState<any>([]);

  const fetchInvoiceList = async () => {
    try {
      const res = await payment.getInvoiceList();
      const sanitzed = await unmapPayment(res.data);
      setInvoiceList(sanitzed);
    } catch (err) {
      Logger.error(err);
    }
  };

  const fetchPaymentList = async () => {
    try {
      const res = await payment.get();
      setPaymentList(res.data.payments);
    } catch (err) {
      Logger.error(err);
    }
  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchInvoiceList();
    fetchPaymentList();
  }, []);

  return (
    <div className="flex-col">
      <Header setShowManualEntryModal={setShowManualEntryModal}/>
      <Table payments={paymentList} />
      {
        showManualEntryModal && <AddManualEntry setShowManualEntryModal={setShowManualEntryModal} invoiceList={invoiceList} fetchPaymentList={fetchPaymentList} fetchInvoiceList={fetchInvoiceList}/>
      }
    </div>
  );
};

export default Payments;
