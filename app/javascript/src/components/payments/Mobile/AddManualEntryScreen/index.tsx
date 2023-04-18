import React from "react";

import { XIcon } from "miruIcons";

import PaymentEntryForm from "../../Modals/PaymentEntryForm";

const AddManualEntryScreen = ({
  invoiceList,
  fetchPaymentList,
  fetchInvoiceList,
  baseCurrency,
  dateFormat,
  setShowManualEntryModal,
}) => (
  <section>
    <div className="relative mb-6 w-full bg-miru-han-purple-1000 py-3 text-center font-manrope font-medium capitalize">
      <h1 className="text-miru-white-1000">Add New Expense</h1>
      <button
        className="modal__button absolute top-1/5 right-0"
        onClick={() => setShowManualEntryModal(false)}
      >
        <XIcon color="#FFFFFF" size={16} />
      </button>
    </div>
    <div className="mx-auto mt-0 min-h-70v w-full px-4 md:mt-12 md:w-5/6 lg:mt-0">
      <PaymentEntryForm
        baseCurrency={baseCurrency}
        dateFormat={dateFormat}
        fetchInvoiceList={fetchInvoiceList}
        fetchPaymentList={fetchPaymentList}
        invoiceList={invoiceList}
        setShowManualEntryModal={setShowManualEntryModal}
      />
    </div>
  </section>
);

export default AddManualEntryScreen;
