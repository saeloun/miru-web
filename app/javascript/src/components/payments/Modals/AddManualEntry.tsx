import React from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

import PaymentEntryForm from "./PaymentEntryForm";

const AddManualEntry = ({
  setShowManualEntryModal,
  invoiceList,
  dateFormat,
  fetchPaymentList,
  fetchInvoiceList,
  baseCurrency,
  showManualEntryModal,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
    isOpen={showManualEntryModal}
    onClose={() => setShowManualEntryModal(false)}
  >
    <div className="modal__position m-0">
      <h6 className="modal__title"> Add Payment</h6>
      <div className="modal__close">
        <button
          className="modal__button"
          onClick={() => setShowManualEntryModal(false)}
        >
          <XIcon color="#CDD6DF" size={15} />
        </button>
      </div>
    </div>
    <div className="modal__form m-0 flex-col">
      <PaymentEntryForm
        baseCurrency={baseCurrency}
        dateFormat={dateFormat}
        fetchInvoiceList={fetchInvoiceList}
        fetchPaymentList={fetchPaymentList}
        invoiceList={invoiceList}
        setShowManualEntryModal={setShowManualEntryModal}
      />
    </div>
  </Modal>
);

export default AddManualEntry;
