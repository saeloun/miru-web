import React, { useState, useRef, useEffect } from "react";

import dayjs from "dayjs";
import { currencyFormat, useOutsideClick } from "helpers";
import { CalendarIcon, SearchIcon } from "miruIcons";
import Select, { DropdownIndicatorProps, components } from "react-select";
import { Badge, MobileMoreOptions } from "StyledComponents";

import payment from "apis/payments/payments";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomValueContainer } from "common/CustomReactSelectStyle";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import Toastr from "common/Toastr";
import { useUserContext } from "context/UserContext";
import { mapPayment } from "mapper/mappedIndex";
import getStatusCssClass from "utils/getBadgeStatus";

import { customStyles } from "./styles";

const PaymentEntryForm = ({
  invoiceList,
  fetchPaymentList,
  fetchInvoiceList,
  baseCurrency,
  dateFormat,
  setShowManualEntryModal,
}) => {
  const invoiceId = new URLSearchParams(window.location.search).get(
    "invoiceId"
  );
  const { isDesktop } = useUserContext();

  const [invoice, setInvoice] = useState<any>(null);
  const [transactionDate, setTransactionDate] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<any>(null);
  const [amount, setAmount] = useState<any>(null);
  const [note, setNote] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [showSelectInvoice, setShowSelectInvoice] = useState<any>(false);
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const [showTransactionTypes, setShowTransactionTypes] =
    useState<boolean>(false);

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

  const isAddPaymentBtnActive = (
    invoice,
    transactionDate,
    transactionType,
    amount
  ) => invoice && transactionDate && transactionType && amount;

  useEffect(() => {
    if (invoiceId) {
      handleSelectedInvoice();
    } else {
      setShowSelectInvoice(true);
    }
  }, [invoiceList]);

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setShowDatePicker({ visibility: false });
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  useOutsideClick(wrapperSelectRef, () => {
    setShowSelectMenu(false);
  });

  useOutsideClick(wrapperCalendartRef, () => {
    setShowDatePicker({ visibility: false });
  });

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

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <SearchIcon color="#1D1A31" size={20} />
    </components.DropdownIndicator>
  );

  const handleDatePicker = date => {
    setTransactionDate(date);
    setShowDatePicker(false);
  };

  const handleInvoiceSelect = val => {
    setShowSelectMenu(!showSelectMenu);
    setInvoice(val);
    setAmount(val.amount);
  };

  const handleShowSelectMenu = () => {
    setShowSelectMenu(!showSelectMenu);
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
          <span className="rounded-lg">
            <Badge
              className={`${getStatusCssClass(data.status)} uppercase`}
              text={data.status}
            />
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative mt-4">
        <div className="field">
          <div className="mt-1" id="invoice" ref={wrapperSelectRef}>
            {showSelectInvoice && (
              <div
                className="relative mt-3"
                id="invoicesList"
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
                    id="transactionDate"
                    onClick={e => e.stopPropagation()}
                  >
                    <Select
                      defaultMenuIsOpen
                      isSearchable
                      className="m-0 mt-2 w-full border-0 font-medium text-miru-dark-purple-1000"
                      classNamePrefix="border-0 font-medium text-miru-dark-purple-1000"
                      defaultValue={invoice}
                      id="selectDate"
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
            value={transactionDate && dayjs(transactionDate).format(dateFormat)}
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
        {isDesktop ? (
          <CustomReactSelect
            isSearchable
            handleOnChange={e => setTransactionType(e.value)}
            label="Transaction Type"
            name="transactionType"
            options={transactionTypes}
            value={transactionTypes.find(type => type.value == transactionType)}
          />
        ) : (
          <>
            <CustomReactSelect
              isDisabled={showTransactionTypes}
              label="Transaction Type"
              name="transactionType"
              options={transactionTypes}
              handleonFocus={() => {
                setShowTransactionTypes(true);
              }}
              value={transactionTypes.find(
                type => type.value == transactionType
              )}
            />
            {showTransactionTypes && (
              <MobileMoreOptions
                className="h-3/4 w-full overflow-scroll md:w-3/4 lg:h-1/4"
                setVisibilty={setShowTransactionTypes}
              >
                {transactionTypes.map((transaction, index) => (
                  <li
                    className="flex items-center pb-5 font-manrope text-sm font-normal capitalize leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100"
                    key={index}
                    onClick={() => {
                      if (transaction?.value) {
                        setTransactionType(transaction.value);
                      }
                      setShowTransactionTypes(false);
                    }}
                  >
                    {transaction.label}
                  </li>
                ))}
              </MobileMoreOptions>
            )}
          </>
        )}
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
          value={amount && baseCurrency && currencyFormat(baseCurrency, amount)}
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
      <div className="actions absolute bottom-0 mx-auto mt-4 mb-4 w-11/12 md:relative md:w-full">
        <button
          type="submit"
          className={
            isAddPaymentBtnActive(
              invoice,
              transactionDate,
              transactionType,
              amount
            )
              ? "focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-han-purple-1000 py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-miru-white-1000 shadow-sm hover:bg-miru-han-purple-600"
              : "focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-gray-1000 py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-miru-white-1000 shadow-sm"
          }
          onClick={() => {
            if (
              isAddPaymentBtnActive(
                invoice,
                transactionDate,
                transactionType,
                amount
              )
            ) {
              handleAddPayment();
            }
          }}
        >
          ADD PAYMENT
        </button>
      </div>
    </>
  );
};

export default PaymentEntryForm;
