/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Select, { DropdownIndicatorProps, components } from "react-select";
import payment from "apis/payments/payments";
import CustomDatePicker from "common/CustomDatePicker";
import Toastr from "common/Toastr";
import dayjs from "dayjs";

import { X, Calendar } from "phosphor-react";
import { MagnifyingGlass } from "phosphor-react";
import { mapPayment } from "../../../mapper/payment.mapper";

const AddManualEntry = ({ setShowManualEntryModal, invoiceList, fetchPaymentList }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [transactionDate, setTransactionDate] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<any>(null);
  const [amount, setAmount] = useState<any>(null);
  const [note, setNote] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [isOpen, setOpen] = useState<any>(false);

  const transactionTypes = [
    { label: "Visa", value: "visa" },
    { label: "Mastercard", value: "mastercard" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "ACH", value: "ach" },
    { label: "Amex", value: "amex" },
    { label: "Cash", value: "cash" },
    { label: "Cheque", value: "cheque" },
    { label: "Credit Card", value: "credit_card" },
    { label: "Debit Card", value: "debit_card" },
    { label: "Paypal", value: "paypal" },
    { label: "Stripe", value: "stripe" }
  ];

  const handleAddPayment = async () => {
    try {
      const sanitized = mapPayment({
        invoice,
        transactionDate,
        transactionType,
        amount,
        note
      });
      await payment.create(sanitized);
      Toastr.success("Manual entry added successfully.");
      fetchPaymentList();
      setInvoice("");
      setTransactionDate("");
      setTransactionType("");
      setAmount("");
      setNote("");
      setShowManualEntryModal(false);

    } catch (err) {
      Toastr.error("Failed to add manual entry");
    }
  };

  const handleDatePicker = (date) => {
    setTransactionDate(date);
    setShowDatePicker(false);
  };

  const handleInvoiceSelect = (val) => {
    setInvoice(val);
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      {isOpen && <MagnifyingGlass size={20} color="#1D1A31" />}
    </components.DropdownIndicator>
  );

  const customStyles = {
    placeholder: (defaultStyles) => ({
      ...defaultStyles,
      background: "#F5F7F9",
      color: "#A5A3AD"
    }),
    menu: (base) => ({
      ...base,
      border: 0
    }),
    control: (provided) => ({
      ...provided,
      border: 0,
      background: "#F5F7F9",
      boxShadow: "none"
    }),
    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? "#F5F7F9" : null,
      "&:hover": {
        backgroundColor: "#F5F7F9"
      }
    })
  };

  const CustomOption = (props) => {
    const { innerProps, innerRef } = props;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className=" p-2 flex justify-between items-center"
      >
        <div className="pr-6 pl-0 py-2.5 text-left">
          <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
            {props.data.label}
          </h1>
          <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
            {props.data.invoiceNumber}
          </h3>
        </div>
        <div className="px-6 py-2.5 text-left">
          <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
            {props.data.amount}
          </h1>
          <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
            {props.data.invoiceDate}
          </h3>
        </div>
        <div className="pl-6 pr-0 py-2.5 text-sm font-semibold tracking-wider leading-4 text-right">
          <span className="bg-miru-alert-green-400 text-miru-alert-green-800 rounded-lg px-1">
            {props.data.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="modal__modal main-modal"
      style={{ background: "rgba(29, 26, 49,0.6)" }}
    >
      <div className="modal__container modal-container">
        <div className="modal__content modal-content">
          <div className="modal__position">
            <h6 className="modal__title"> Add Payment</h6>
            <div className="modal__close">
              <button
                className="modal__button"
                onClick={() => setShowManualEntryModal(false)}
              >
                <X size={15} color="#CDD6DF" />
              </button>
            </div>
          </div>
          <div className="modal__form flex-col">
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Invoice
                  </label>
                </div>
                <div className="mt-1">
                  <Select
                    onMenuOpen={() => setOpen(true)}
                    onMenuClose={() => setOpen(false)}
                    defaultValue={null}
                    onChange={handleInvoiceSelect}
                    options={invoiceList.invoiceList}
                    placeholder="Search by client name or invoice ID"
                    isSearchable={true}
                    className="m-0 mt-2 w-full font-medium text-miru-dark-purple-1000 border-0"
                    classNamePrefix="border-0 font-medium text-miru-dark-purple-1000"
                    styles={customStyles}
                    components={{
                      Option: CustomOption,
                      DropdownIndicator,
                      IndicatorSeparator: () => null
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Transaction Date
                  </label>
                </div>
                <div
                  className="mt-1 relative"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <input
                    type="text"
                    disabled
                    placeholder="DD.MM.YYYY"
                    className="rounded appearance-none border-0 block w-full px-3 py-2 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                    value={transactionDate && dayjs(transactionDate).format("DD.MM.YYYY") }
                  />
                  <Calendar
                    size={20}
                    className="absolute top-0 right-0 m-2"
                    color="#5B34EA"
                  />
                  {showDatePicker && (
                    <CustomDatePicker
                      handleChange={handleDatePicker}
                      dueDate={transactionDate}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Transaction Type
                  </label>
                </div>
                <div className="mt-1">
                  <select
                    className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                    onChange={(e) => setTransactionType(e.target.value)}
                  >
                    <option
                      value=""
                      disabled
                      hidden
                      selected
                      style={{ color: "#A5A3AD" }}
                    >
                      Select
                    </option>
                    {transactionTypes.map((type) => (
                      <option value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Amount
                  </label>
                </div>
                <div className="mt-1">
                  <input
                    type="text"
                    placeholder="Payment Amount"
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded appearance-none border-0 block w-full px-3 py-2 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Notes(Optional)
                  </label>
                </div>
                <div className="mt-1">
                  <textarea
                    rows={3}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note"
                    className="rounded appearance-none border-0 block w-full px-3 py-2 bg-miru-gray-100 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="actions mt-4">
              {invoice && transactionDate && transactionType && amount ? (
                <button
                  onClick={handleAddPayment}
                  type="submit"
                  className="tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 focus:outline-none rounded cursor-pointer"
                >
                  ADD PAYMENT
                </button>
              ) : (
                <button
                  type="submit"
                  className="tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-gray-1000 focus:outline-none rounded cursor-pointer"
                  disabled
                >
                  ADD PAYMENT
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddManualEntry;
