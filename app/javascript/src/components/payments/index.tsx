import React, { useEffect, useState } from "react";

import Logger from "js-logger";

import payment from "apis/payments/payments";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { unmapPayment } from "mapper/mappedIndex";

import Header from "./Header";
import AddManualEntryScreen from "./Mobile/AddManualEntryScreen";
import TableOnMobileView from "./Mobile/Table";
import AddManualEntry from "./Modals/AddManualEntry";
import { PaymentsEmptyState } from "./PaymentsEmptyState";
import Table from "./Table";

const Payments = () => {
  const [showManualEntryModal, setShowManualEntryModal] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentList, setPaymentList] = useState<any>([]);
  const [invoiceList, setInvoiceList] = useState<any>([]);
  const [dateFormat, setDateFormat] = useState<any>("");
  const [baseCurrency, setBaseCurrency] = useState<any>("");
  const [searchedPaymentList, setSearchedPaymentList] = useState<any>([]);
  const [showSearchedPayments, setShowSearchedPayments] =
    useState<boolean>(false);

  const [params, setParams] = useState({
    query: "",
  });
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

  const isPaymentListEmpty = (
    showSearchedPayments: boolean,
    paymentList: any[],
    searchedPaymentList: any[]
  ) =>
    showSearchedPayments ? !searchedPaymentList?.length : !paymentList?.length;

  const fetchData = async () => {
    try {
      await fetchInvoiceList();
      await fetchPaymentList();
      checkInvoiceIdInUrl();
      setLoading(false);
    } catch (e) {
      Logger.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEscKeyPress = (e: any) => {
    if (e?.key?.trim()?.toLowerCase() == "escape" && showManualEntryModal) {
      setShowManualEntryModal(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const PaymentsLayout = () => (
    <div className="h-full flex-col p-4" onKeyDown={handleEscKeyPress}>
      <Header
        params={params}
        payments={paymentList}
        setParams={setParams}
        setSearchedPaymentList={setSearchedPaymentList}
        setShowManualEntryModal={setShowManualEntryModal}
        setShowSearchedPayments={setShowSearchedPayments}
        showSearchedPayments={showSearchedPayments}
      />
      {isPaymentListEmpty(
        showSearchedPayments,
        paymentList,
        searchedPaymentList
      ) ? (
        <PaymentsEmptyState setShowManualEntryModal={setShowManualEntryModal} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table
              baseCurrency={baseCurrency}
              payments={
                showSearchedPayments ? searchedPaymentList : paymentList
              }
            />
          </div>
          <div className="block md:hidden">
            <TableOnMobileView
              baseCurrency={baseCurrency}
              payments={
                showSearchedPayments ? searchedPaymentList : paymentList
              }
            />
          </div>
        </>
      )}
      {showManualEntryModal && isDesktop && (
        <AddManualEntry
          baseCurrency={baseCurrency}
          dateFormat={dateFormat}
          fetchInvoiceList={fetchInvoiceList}
          fetchPaymentList={fetchPaymentList}
          invoiceList={invoiceList}
          setShowManualEntryModal={setShowManualEntryModal}
          showManualEntryModal={showManualEntryModal}
        />
      )}
    </div>
  );

  const Main = withLayout(PaymentsLayout, !isDesktop, !isDesktop);

  if (showManualEntryModal && !isDesktop) {
    return (
      <AddManualEntryScreen
        baseCurrency={baseCurrency}
        dateFormat={dateFormat}
        fetchInvoiceList={fetchInvoiceList}
        fetchPaymentList={fetchPaymentList}
        invoiceList={invoiceList}
        setShowManualEntryModal={setShowManualEntryModal}
      />
    );
  }

  return isDesktop ? PaymentsLayout() : <Main />;
};

export default Payments;
