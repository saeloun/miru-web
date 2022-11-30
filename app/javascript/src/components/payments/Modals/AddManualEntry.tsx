/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";

import dayjs from "dayjs";
import { XIcon, CalendarIcon, SearchIcon } from "miruIcons";
import Select, { DropdownIndicatorProps, components } from "react-select";

import payment from "apis/payments/payments";
import CustomDatePicker from "common/CustomDatePicker";
import Toastr from "common/Toastr";

import { mapPayment } from "../../../mapper/payment.mapper";

const AddManualEntry = ({
  setShowManualEntryModal,
  invoiceList,
  fetchPaymentList,
  fetchInvoiceList,
}) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [transactionDate, setTransactionDate] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<any>(null);
  const [amount, setAmount] = useState<any>(null);
  const [note, setNote] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [isOpen, setIsOpen] = useState<any>(false);

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
    { label: "Stripe", value: "stripe" },
  ];

  const handleAddPayment = async () => {
    try {
      const sanitized = mapPayment({
        invoice,
        transactionDate,
        transactionType,
        amount,
        note,
      });
      await payment.create(sanitized);
      Toastr.success("Manual entry added successfully.");
      fetchPaymentList();
      fetchInvoiceList();
      setInvoice("");
      setTransactionDate("");
      setTransactionType("");
      setAmount("");
      setNote("");
      setShowManualEntryModal(false);
    } catch {
      Toastr.error("Failed to add manual entry");
    }
  };

  const handleDatePicker = date => {
    setTransactionDate(date);
    setShowDatePicker(false);
  };

  const handleInvoiceSelect = val => {
    setInvoice(val);
    setAmount(val.amount);
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      {isOpen && <SearchIcon color="#1D1A31" size={20} />}
    </components.DropdownIndicator>
  );

  const customStyles = {
    placeholder: defaultStyles => ({
      ...defaultStyles,
      background: "#F5F7F9",
      color: "#A5A3AD",
    }),
    menu: base => ({
      ...base,
      border: 0,
    }),
    control: provided => ({
      ...provided,
      border: 0,
      background: "#F5F7F9",
      boxShadow: "none",
    }),
    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? "#F5F7F9" : null,
      "&:hover": {
        backgroundColor: "#F5F7F9",
      },
    }),
  };

  const CustomOption = props => {
    const { innerProps, innerRef } = props;

    return (
      <div
        ref={innerRef}
        {...innerProps}
        className=" flex items-center justify-between p-2"
      >
        <div className="py-2.5 pr-6 pl-0 text-left">
          <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
            {props.data.label}
          </h1>
          <h3 className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
            {props.data.invoiceNumber}
          </h3>
        </div>
        <div className="px-6 py-2.5 text-left">
          <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
            {props.data.amount}
          </h1>
          <h3 className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
            {props.data.invoiceDate}
          </h3>
        </div>
        <div className="py-2.5 pl-6 pr-0 text-right text-sm font-semibold leading-4 tracking-wider">
          <span className="rounded-lg bg-miru-alert-green-400 px-1 text-miru-alert-green-800">
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
                <XIcon color="#CDD6DF" size={15} />
              </button>
            </div>
          </div>
          <div className="modal__form flex-col">
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                    Invoice
                  </label>
                </div>
                <div className="mt-1">
                  <Select
                    isSearchable
                    className="m-0 mt-2 w-full border-0 font-medium text-miru-dark-purple-1000"
                    classNamePrefix="border-0 font-medium text-miru-dark-purple-1000"
                    defaultValue={null}
                    options={invoiceList.invoiceList}
                    placeholder="Search by client name or invoice ID"
                    styles={customStyles}
                    components={{
                      Option: CustomOption,
                      DropdownIndicator,
                      IndicatorSeparator: () => null,
                    }}
                    onChange={handleInvoiceSelect}
                    onMenuClose={() => setIsOpen(false)}
                    onMenuOpen={() => setIsOpen(true)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                    Transaction Date
                  </label>
                </div>
                <div
                  className="relative mt-1"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <input
                    disabled
                    className="focus:outline-none block h-8 w-full appearance-none rounded border-0 bg-miru-gray-100 px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                    placeholder="DD.MM.YYYY"
                    type="text"
                    value={
                      transactionDate &&
                      dayjs(transactionDate).format("DD.MM.YYYY")
                    }
                  />
                  <CalendarIcon
                    className="absolute top-0 right-0 m-2"
                    color="#5B34EA"
                    size={20}
                  />
                </div>
                {showDatePicker && (
                  <CustomDatePicker
                    date={transactionDate}
                    handleChange={handleDatePicker}
                  />
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                    Transaction Type
                  </label>
                </div>
                <div className="mt-1">
                  <select
                    className="focus:outline-none block h-8 w-full rounded border-0 bg-miru-gray-100 px-2 py-1 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                    onChange={e => setTransactionType(e.target.value)}
                  >
                    <option
                      disabled
                      hidden
                      selected
                      style={{ color: "#A5A3AD" }}
                      value=""
                    >
                      Select
                    </option>
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                    Amount
                  </label>
                </div>
                <div className="mt-1">
                  <input
                    disabled
                    className="focus:outline-none block h-8 w-full appearance-none rounded border-0 bg-miru-gray-100 px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                    placeholder="Payment Amount"
                    type="text"
                    value={amount}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                    Notes(Optional)
                  </label>
                </div>
                <div className="mt-1">
                  <textarea
                    className="focus:outline-none block w-full appearance-none rounded border-0 bg-miru-gray-100 px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                    placeholder="Note"
                    rows={3}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="actions mt-4">
              {invoice && transactionDate && transactionType && amount ? (
                <button
                  className="focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-han-purple-1000 py-1 px-4 font-sans text-base font-medium tracking-widest text-miru-white-1000 shadow-sm hover:bg-miru-han-purple-600"
                  type="submit"
                  onClick={handleAddPayment}
                >
                  ADD PAYMENT
                </button>
              ) : (
                <button
                  disabled
                  className="focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-gray-1000 py-1 px-4 font-sans text-base font-medium tracking-widest text-miru-white-1000 shadow-sm"
                  type="submit"
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
