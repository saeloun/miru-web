import React, { useState, useRef, useEffect } from "react";

import { payment } from "apis/api";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomValueContainer } from "common/CustomReactSelectStyle";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { Form, Formik, FormikProps } from "formik";
import { currencyFormat, useOutsideClick } from "helpers";
import { mapPayment } from "mapper/mappedIndex";
import { CalendarIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge, MobileMoreOptions, Toastr } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

import { transactionTypes } from "./constants";
import { paymentEntryInitialValues } from "./utils";

interface PaymentEntryFormValues {
  invoice: any;
  transactionDate: any;
  amount: any;
  transactionType: any;
  showTransactionTypes: boolean;
  note: any;
}

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

  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [showSelectInvoice, setShowSelectInvoice] = useState<any>(false);
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wrapperSelectRef = useRef(null);
  const wrapperCalendartRef = useRef(null);

  const navigate = useNavigate();

  const handleSelectedInvoice = setFieldValue => {
    if (!invoiceList || invoiceList.length === 0) return;
    const selectedInvoice = invoiceList.invoiceList.find(
      invoice => invoice.value === Number(invoiceId)
    );
    if (selectedInvoice) {
      setFieldValue("invoice", selectedInvoice);
      setFieldValue("amount", selectedInvoice.amount);
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

  const handleAddPayment = async values => {
    const { invoice, transactionDate, transactionType, amount, note } = values;
    if (
      !isAddPaymentBtnActive(invoice, transactionDate, transactionType, amount)
    ) {
      return;
    }

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
      setIsLoading(false);
      fetchPaymentList();
      fetchInvoiceList();
      setShowManualEntryModal(false);
      if (invoiceId) {
        navigate(`/invoices/${invoiceId}`);
      }
    } catch {
      Toastr.error("Failed to add manual entry");
      setIsLoading(false);
    }
  };

  const handleShowSelectMenu = () => {
    setShowSelectMenu(!showSelectMenu);
  };

  return (
    <Formik
      initialValues={paymentEntryInitialValues}
      onSubmit={async (values, { resetForm }) => {
        await handleAddPayment(values);
        resetForm();
      }}
    >
      {(props: FormikProps<PaymentEntryFormValues>) => {
        const { values, setFieldValue } = props;

        if (invoiceId) {
          handleSelectedInvoice(setFieldValue);
        } else {
          setShowSelectInvoice(true);
        }

        const setShowTransactionTypes = visibilty => {
          setFieldValue("showTransactionTypes", visibilty);
        };

        const {
          invoice,
          transactionDate,
          amount,
          transactionType,
          showTransactionTypes,
          note,
        } = values;

        const isPaymentBtnActive = () =>
          isAddPaymentBtnActive(
            invoice,
            transactionDate,
            transactionType,
            amount
          );

        return (
          <Form>
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
                        classNamePrefix="border-0 font-medium text-foreground"
                        defaultValue={invoice}
                        id="invoice"
                        label="Invoice"
                        name="invoiceSearch"
                        options={invoiceList.invoiceList}
                        value={invoice}
                        components={{
                          ValueContainer: CustomValueContainer,
                          IndicatorSeparator: () => null,
                        }}
                        handleOnChange={val => {
                          setShowSelectMenu(!showSelectMenu);
                          setFieldValue("invoice", val);
                          setFieldValue("amount", amount);
                        }}
                      />
                      {showSelectMenu && (
                        <div
                          className="absolute right-0 top-0 z-15 min-h-24 w-full flex-col items-end bg-white p-2 shadow-c1 group-hover:flex"
                          id="transactionDate"
                          onClick={e => e.stopPropagation()}
                        >
                          <Select
                            defaultOpen
                            value={invoice?.value?.toString() || ""}
                            onValueChange={value => {
                              const selectedInvoice =
                                invoiceList.invoiceList.find(
                                  inv => inv.value.toString() === value
                                );
                              setShowSelectMenu(!showSelectMenu);
                              setFieldValue("invoice", selectedInvoice);
                              setFieldValue("amount", selectedInvoice.amount);
                            }}
                          >
                            <SelectTrigger className="m-0 mt-2 w-full border-0 font-medium text-foreground">
                              <SelectValue placeholder="Search by client name or invoice ID" />
                            </SelectTrigger>
                            <SelectContent>
                              {invoiceList.invoiceList.map(invoiceOption => (
                                <SelectItem
                                  key={invoiceOption.value}
                                  value={invoiceOption.value.toString()}
                                >
                                  <div className="flex w-full cursor-pointer flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                                    <div className="w-full py-2 pr-0 pl-0 text-left sm:w-2/6 sm:py-3 sm:pr-2">
                                      <div className="truncate text-sm font-medium leading-5 text-foreground">
                                        {invoiceOption.label}
                                      </div>
                                      <div className="pt-1 text-sm font-normal leading-5 text-muted-foreground">
                                        {invoiceOption.invoiceNumber}
                                      </div>
                                    </div>
                                    <div className="w-full px-0 py-2 text-left sm:w-2/6 sm:px-2 sm:py-3 sm:text-right">
                                      <div className="text-base font-bold leading-5 text-foreground">
                                        {baseCurrency &&
                                          currencyFormat(
                                            baseCurrency,
                                            invoiceOption.amount
                                          )}
                                      </div>
                                      <div className="pt-1 text-sm font-medium leading-5 text-muted-foreground">
                                        {dayjs(
                                          invoiceOption.invoiceDate
                                        ).format(dateFormat)}
                                      </div>
                                    </div>
                                    <div className="w-full py-1 pl-0 pr-0 text-left text-sm font-semibold leading-4 tracking-wider sm:w-2/6 sm:py-3 sm:pl-2 sm:text-right">
                                      <span className="rounded-lg">
                                        <Badge
                                          className={`${getStatusCssClass(
                                            invoiceOption.status
                                          )} uppercase`}
                                          text={invoiceOption.status}
                                        />
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                  readOnly
                  id="transactionDate"
                  inputBoxClassName="cursor-pointer"
                  label="Transaction Date"
                  name="transactionDate"
                  type="text"
                  value={
                    transactionDate && dayjs(transactionDate).format(dateFormat)
                  }
                  onChange={() => {}}
                />
                <CalendarIcon
                  className="absolute top-0 bottom-0 right-1 mx-2 my-3 cursor-pointer"
                  color="#5E58F1"
                  size={20}
                />
              </div>
              {showDatePicker.visibility && (
                <CustomDatePicker
                  date={transactionDate || dayjs()}
                  handleChange={date => {
                    setFieldValue("transactionDate", date);
                    setShowDatePicker(false);
                  }}
                />
              )}
            </div>
            <div
              className="relative mt-4"
              id="transactionType"
              onClick={() => setFieldValue("showTransactionTypes", true)}
            >
              {isDesktop ? (
                <CustomReactSelect
                  isSearchable
                  label="Transaction Type"
                  name="transactionType"
                  options={transactionTypes}
                  handleOnChange={e =>
                    setFieldValue("transactionType", e.value)
                  }
                  value={transactionTypes.find(
                    type => type.value == transactionType
                  )}
                />
              ) : (
                <>
                  <CustomReactSelect
                    isDisabled
                    label="Transaction Type"
                    name="transactionType"
                    options={transactionTypes}
                    handleonFocus={() =>
                      setFieldValue("showTransactionTypes", true)
                    }
                    value={transactionTypes.find(
                      type => type.value == transactionType
                    )}
                  />
                  {showTransactionTypes && (
                    <MobileMoreOptions
                      className="max-h-[70vh] w-full overflow-y-auto md:max-h-[60vh] md:w-3/4 lg:max-h-[40vh]"
                      setVisibilty={setShowTransactionTypes}
                      visibilty={showTransactionTypes}
                    >
                      {transactionTypes.map((transaction, index) => (
                        <li
                          className="flex items-center pb-5 font-sans text-sm font-normal capitalize leading-5 text-foreground hover:bg-muted"
                          key={index}
                          onClick={() => {
                            if (transaction?.value) {
                              setFieldValue(
                                "transactionType",
                                transaction.value
                              );
                            }
                            setFieldValue("showTransactionTypes", false);
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
                inputBoxClassName="form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-primary border-border"
                label="Payment amount"
                labelClassName="absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300 text-muted-foreground"
                name="paymentAmount"
                type="text"
                value={
                  amount && baseCurrency && currencyFormat(baseCurrency, amount)
                }
                onChange={() => {}}
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
                onChange={e => setFieldValue("note", e.target.value)}
              />
            </div>
            <div className="actions mx-auto mt-4 mb-4 w-full">
              <button
                disabled={isLoading}
                type="submit"
                className={
                  isPaymentBtnActive() && !isLoading
                    ? "focus:outline-none flex h-10 w-full cursor-pointer items-center justify-center rounded border border-transparent bg-primary py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "focus:outline-none flex h-10 w-full cursor-pointer items-center justify-center rounded border border-transparent bg-secondary py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-primary-foreground shadow-sm"
                }
              >
                ADD PAYMENT
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default PaymentEntryForm;
