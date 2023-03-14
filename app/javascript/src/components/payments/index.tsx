import React, { useEffect, useState } from "react";

import Logger from "js-logger";

import payment from "apis/payments/payments";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { unmapPayment } from "mapper/mappedIndex";

import Header from "./Header";
import AddManualEntry from "./Modals/AddManualEntry";
import Table from "./Table";

const Payments = () => {
  const [showManualEntryModal, setShowManualEntryModal] =
    useState<boolean>(false);
  const [paymentList, setPaymentList] = useState<any>([]);
  const [invoiceList, setInvoiceList] = useState<any>([]);
  const [dateFormat, setDateFormat] = useState<any>("");
  const [baseCurrency, setBaseCurrency] = useState<any>("");
  const { isDesktop } = useUserContext();
  const fetchInvoiceList = async () => {
    try {
      const { data } = await payment.getInvoiceList();
      const sanitzed = await unmapPayment(data);
      setInvoiceList(sanitzed);
      setDateFormat(data.company.dateFormat);
    } catch (err) {
      Logger.error(err);
    }
  };

  const fetchPaymentList = async () => {
    try {
      const res = await payment.get();
      setPaymentList(res.data.payments);
      setBaseCurrency(res.data.baseCurrency);
    } catch (err) {
      Logger.error(err);
    }
  };

  const checkInvoiceIdInUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get("invoiceId");
    if (invoiceId) {
      setShowManualEntryModal(true);
    }
  };

  useEffect(() => {
    fetchInvoiceList();
    fetchPaymentList();
    checkInvoiceIdInUrl();
  }, []);

  const PaymentsLayout = () => (
    <div className="flex-col">
      <Header setShowManualEntryModal={setShowManualEntryModal} />
      <Table baseCurrency={baseCurrency} payments={paymentList} />
      {showManualEntryModal && (
        <AddManualEntry
          baseCurrency={baseCurrency}
          dateFormat={dateFormat}
          fetchInvoiceList={fetchInvoiceList}
          fetchPaymentList={fetchPaymentList}
          invoiceList={invoiceList}
          setShowManualEntryModal={setShowManualEntryModal}
        />
      )}
    </div>
  );

  const Main = withLayout(PaymentsLayout, !isDesktop, !isDesktop);

  return <Main />;
};

export default Payments;
