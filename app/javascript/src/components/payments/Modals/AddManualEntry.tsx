/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import { XIcon } from "miruIcons";

import PaymentEntryForm from "./PaymentEntryForm";

import AddManualEntryScreen from "../Mobile/AddManualEntryScreen";

const AddManualEntry = ({
  setShowManualEntryModal,
  invoiceList,
  dateFormat,
  fetchPaymentList,
  fetchInvoiceList,
  baseCurrency,
}) => (
  <>
    <div
      className="modal__modal main-modal hidden lg:flex"
      style={{ background: "rgba(29, 26, 49,0.6)" }}
      onClick={() => setShowManualEntryModal(false)}
    >
      <div className="modal__container modal-container">
        <div
          className="modal__content modal-content"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal__position">
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
          <div className="modal__form flex-col">
            <PaymentEntryForm
              baseCurrency={baseCurrency}
              dateFormat={dateFormat}
              fetchInvoiceList={fetchInvoiceList}
              fetchPaymentList={fetchPaymentList}
              invoiceList={invoiceList}
              setShowManualEntryModal={setShowManualEntryModal}
            />
          </div>
        </div>
      </div>
    </div>
    <div className="block lg:hidden">
      <AddManualEntryScreen
        baseCurrency={baseCurrency}
        dateFormat={dateFormat}
        fetchInvoiceList={fetchInvoiceList}
        fetchPaymentList={fetchPaymentList}
        invoiceList={invoiceList}
        setShowManualEntryModal={setShowManualEntryModal}
      />
    </div>
  </>
);

export default AddManualEntry;
