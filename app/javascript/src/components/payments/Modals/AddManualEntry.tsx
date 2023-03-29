/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";

import dayjs from "dayjs";
import { currencyFormat, useOutsideClick } from "helpers";
import { XIcon, CalendarIcon, SearchIcon } from "miruIcons";
import Select, { DropdownIndicatorProps, components } from "react-select";

import payment from "apis/payments/payments";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomValueContainer } from "common/CustomReactSelectStyle";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import Toastr from "common/Toastr";
import { mapPayment } from "mapper/mappedIndex";

const AddManualEntry = ({
  setShowManualEntryModal,
  invoiceList,
  dateFormat,
  fetchPaymentList,
  fetchInvoiceList,
  baseCurrency,
}) => {
  const invoiceId = new URLSearchParams(window.location.search).get(
    "invoiceId"
  );
  const [invoice, setInvoice] = useState<any>(null);
  const [transactionDate, setTransactionDate] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<any>(null);
  const [amount, setAmount] = useState<any>(null);
  const [note, setNote] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [showSelectInvoice, setShowSelectInvoice] = useState<any>(false);
  const [showSelectMenu, setShowSelectMenu] = useState(false);

  const wrapperSelectRef = useRef(null);
  const wrapperCalendartRef = useRef(null);

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
    setShowSelectMenu(!showSelectMenu);
    setInvoice(val);
    setAmount(val.amount);
  };

  useOutsideClick(wrapperSelectRef, () => {
    setShowSelectMenu(false);
  });

  useOutsideClick(wrapperCalendartRef, () => {
    setShowDatePicker({ visibility: false });
  });

  const handleSelectedInvoice = () => {
    if (!invoiceList || invoiceList.length == 0) return;
    const selectedInvoice = invoiceList.invoiceList.find(
      invoice => invoice.value === Number(invoiceId)
    );
    if (selectedInvoice) {
      setInvoice(selectedInvoice);
      setAmount(selectedInvoice.amount);
      setShowSelectInvoice(true);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      handleSelectedInvoice();
    } else {
      setShowSelectInvoice(true);
    }
  }, [invoiceList]);

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <SearchIcon color="#1D1A31" size={20} />
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
      marginTop: 0,
      marginBottom: 0,
      border: "none",
      boxShadow: "none",
      backgroundColor: "white",
      position: "relative",
      zIndex: 3,
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
    const { innerProps, innerRef, data } = props;

    return (
      <div
        ref={innerRef}
        {...innerProps}
        className=" flex cursor-pointer items-center justify-between p-2"
      >
        <div className="w-2/6 py-3 pr-2 pl-0 text-left">
          <div className="truncate text-sm font-medium leading-5 text-miru-dark-purple-1000">
            {data.label}
          </div>
          <div className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
            {data.invoiceNumber}
          </div>
        </div>
        <div className="w-2/6 px-2 py-3 text-right	">
          <div className="text-base font-bold leading-5 text-miru-dark-purple-1000">
            {baseCurrency && currencyFormat(baseCurrency, data.amount)}
          </div>
          <div className="pt-1 text-sm font-medium leading-5 text-miru-dark-purple-400">
            {dayjs(data.invoiceDate).format(dateFormat)}
          </div>
        </div>
        <div className="w-2/6 py-3 pl-2 pr-0 text-right text-sm font-semibold leading-4 tracking-wider">
          <span className="rounded-lg bg-miru-alert-green-400 px-1 text-miru-alert-green-800">
            {data.status}
          </span>
        </div>
      </div>
    );
  };

  const handleShowSelectMenu = () => {
    setShowSelectMenu(!showSelectMenu);
  };

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setShowDatePicker({ visibility: false });
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

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
                <div className="mt-1" ref={wrapperSelectRef}>
                  {showSelectInvoice && (
                    <div
                      className="relative mt-3"
                      onClick={handleShowSelectMenu}
                    >
                      <CustomReactSelect
                        ignoreDisabledFontColor
                        isDisabled
                        isSearchable
                        classNamePrefix="border-0 font-medium text-miru-dark-purple-1000"
                        defaultValue={invoice}
                        handleOnChange={handleInvoiceSelect}
                        label="Invoice"
                        name="invoiceSearch"
                        options={invoiceList.invoiceList}
                        value={invoice}
                        components={{
                          ValueContainer: CustomValueContainer,
                          IndicatorSeparator: () => null,
                        }}
                      />
                      {showSelectMenu && (
                        <div
                          className="absolute right-0 top-0 z-15 min-h-24 w-full flex-col items-end bg-white p-2 shadow-c1 group-hover:flex"
                          onClick={e => e.stopPropagation()}
                        >
                          <Select
                            defaultMenuIsOpen
                            isSearchable
                            className="m-0 mt-2 w-full border-0 font-medium text-miru-dark-purple-1000"
                            classNamePrefix="border-0 font-medium text-miru-dark-purple-1000"
                            defaultValue={invoice}
                            options={invoiceList.invoiceList}
                            placeholder="Search by client name or invoice ID"
                            styles={customStyles}
                            components={{
                              Option: CustomOption,
                              DropdownIndicator,
                              IndicatorSeparator: () => null,
                            }}
                            onChange={handleInvoiceSelect}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4" ref={wrapperCalendartRef}>
              <div
                className="field relative flex w-full flex-col"
                onClick={() =>
                  setShowDatePicker({ visibility: !showDatePicker.visibility })
                }
              >
                <CustomInputText
                  disabled
                  id="transactionDate"
                  label="Transaction Date"
                  name="transactionDate"
                  type="text"
                  value={
                    transactionDate && dayjs(transactionDate).format(dateFormat)
                  }
                  onChange={() => {}} //eslint-disable-line
                />
                <CalendarIcon
                  className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                  color="#5B34EA"
                  size={20}
                />
              </div>
              {showDatePicker.visibility && (
                <CustomDatePicker
                  date={transactionDate ? new Date(transactionDate) : null}
                  handleChange={handleDatePicker}
                />
              )}
            </div>
            <div className="relative mt-4">
              <CustomReactSelect
                isSearchable
                handleOnChange={e => setTransactionType(e.value)}
                label="Transaction Type"
                name="transactionType"
                options={transactionTypes}
                value={transactionTypes.find(
                  type => type.value == transactionType
                )}
              />
            </div>
            <div className="mt-4">
              <CustomInputText
                disabled
                id="paymentAmount"
                inputBoxClassName="form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000 border-miru-gray-1000"
                label="Payment amount"
                labelClassName="absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300 text-miru-dark-purple-200"
                name="paymentAmount"
                type="text"
                value={
                  amount && baseCurrency && currencyFormat(baseCurrency, amount)
                }
                onChange={() => {}} //eslint-disable-line
              />
            </div>
            <div className="mt-4">
              <CustomTextareaAutosize
                id="NotesOptional"
                label="Notes (optional)"
                maxRows={12}
                name="NotesOptional"
                rows={5}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
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
