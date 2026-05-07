import React, { useState, useRef, useEffect } from "react";

import { payment } from "apis/api";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { Form, Formik, FormikProps } from "formik";
import { currencyFormat, useOutsideClick } from "helpers";
import { mapPayment } from "mapper/mappedIndex";
import { CalendarIcon } from "miruIcons";
import { CaretDown } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { i18n } from "../../../i18n";
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
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const [focusedInvoiceIndex, setFocusedInvoiceIndex] = useState(0);
  const [showDesktopTransactionTypes, setShowDesktopTransactionTypes] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wrapperSelectRef = useRef(null);
  const wrapperCalendartRef = useRef(null);
  const wrapperDesktopTransactionTypeRef = useRef(null);

  const navigate = useNavigate();
  const selectedInvoiceFromUrl = invoiceId
    ? invoiceList?.invoiceList?.find(
        invoice => invoice.value === Number(invoiceId)
      ) || null
    : null;
  const invoices = invoiceList?.invoiceList || [];

  const initialValues = {
    ...paymentEntryInitialValues,
    invoice: selectedInvoiceFromUrl,
    amount: selectedInvoiceFromUrl?.amount ?? "",
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
        setShowSelectMenu(false);
        setShowDesktopTransactionTypes(false);
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

  useOutsideClick(wrapperDesktopTransactionTypeRef, () => {
    setShowDesktopTransactionTypes(false);
  });

  const handleAddPayment = async values => {
    const { invoice, transactionDate, transactionType, amount, note } = values;
    if (
      !isAddPaymentBtnActive(invoice, transactionDate, transactionType, amount)
    ) {
      return false;
    }

    setIsLoading(true);

    try {
      const sanitized = mapPayment({
        invoice,
        transactionDate,
        transactionType,
        amount,
        note,
      });
      await payment.create(sanitized);
      Toastr.success(i18n.t("payments.manualEntryAdded"));
      fetchPaymentList();
      fetchInvoiceList();
      setShowManualEntryModal(false);
      if (invoiceId) {
        navigate(`/invoices/${invoiceId}`);
      }

      return true;
    } catch {
      Toastr.error(i18n.t("payments.failedToAddManualEntry"));

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={async (values, { resetForm }) => {
        const saved = await handleAddPayment(values);
        if (saved) resetForm();
      }}
    >
      {(props: FormikProps<PaymentEntryFormValues>) => {
        const { values, setFieldValue } = props;

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

        const selectedTransactionType = transactionTypes.find(
          type => type.value === transactionType
        );

        const selectedInvoiceIndex = invoices.findIndex(
          invoiceOption => invoiceOption.value === invoice?.value
        );

        const initialFocusedInvoiceIndex =
          selectedInvoiceIndex >= 0 ? selectedInvoiceIndex : 0;

        const selectInvoiceOption = invoiceOption => {
          setShowSelectMenu(false);
          setFieldValue("invoice", invoiceOption);
          setFieldValue("amount", invoiceOption.amount ?? "");
        };

        const toggleInvoiceMenu = () => {
          setFocusedInvoiceIndex(initialFocusedInvoiceIndex);
          setShowSelectMenu(previous => !previous);
        };

        const handleInvoiceMenuKeyDown = event => {
          if (!invoices.length) return;

          if (
            !showSelectMenu &&
            ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)
          ) {
            event.preventDefault();
            setFocusedInvoiceIndex(initialFocusedInvoiceIndex);
            setShowSelectMenu(true);

            return;
          }

          if (!showSelectMenu) return;

          switch (event.key) {
            case "ArrowDown":
              event.preventDefault();
              setFocusedInvoiceIndex(
                currentIndex => (currentIndex + 1) % invoices.length
              );
              break;
            case "ArrowUp":
              event.preventDefault();
              setFocusedInvoiceIndex(
                currentIndex =>
                  (currentIndex - 1 + invoices.length) % invoices.length
              );
              break;
            case "Home":
              event.preventDefault();
              setFocusedInvoiceIndex(0);
              break;
            case "End":
              event.preventDefault();
              setFocusedInvoiceIndex(invoices.length - 1);
              break;
            case "Enter":
            case " ":
              event.preventDefault();
              selectInvoiceOption(invoices[focusedInvoiceIndex] || invoices[0]);
              break;
            case "Escape":
              event.preventDefault();
              setShowSelectMenu(false);
              break;
            default:
              break;
          }
        };

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
                  <div className="relative mt-3" id="invoicesList">
                    <label
                      className="absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-base font-medium text-muted-foreground duration-300"
                      htmlFor="manual-payment-invoice-select"
                    >
                      {i18n.t("payments.invoice")}
                    </label>
                    <button
                      aria-activedescendant={
                        showSelectMenu && invoices[focusedInvoiceIndex]
                          ? `manual-payment-invoice-option-${invoices[focusedInvoiceIndex].value}`
                          : undefined
                      }
                      aria-controls="manual-payment-invoice-options"
                      aria-expanded={showSelectMenu}
                      aria-haspopup="listbox"
                      className="flex min-h-14 w-full items-center justify-between rounded-md border border-border bg-background px-4 pt-6 pb-2 text-left text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      data-testid="manual-payment-invoice-select"
                      id="manual-payment-invoice-select"
                      type="button"
                      onClick={toggleInvoiceMenu}
                      onKeyDown={handleInvoiceMenuKeyDown}
                    >
                      {invoice ? (
                        <span>
                          <span className="block font-medium">
                            {invoice.label}
                          </span>
                          <span className="block text-muted-foreground">
                            {invoice.invoiceNumber}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {i18n.t("payments.searchByClientOrInvoice")}
                        </span>
                      )}
                      <CaretDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          showSelectMenu ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showSelectMenu && (
                      <div
                        className="absolute right-0 top-full z-50 mt-1 max-h-80 min-h-24 w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg"
                        data-testid="manual-payment-invoice-options"
                        id="manual-payment-invoice-options"
                        onKeyDown={handleInvoiceMenuKeyDown}
                        role="listbox"
                      >
                        {invoices.map((invoiceOption, index) => (
                          <button
                            aria-selected={
                              invoice?.value === invoiceOption.value
                            }
                            className={`flex w-full cursor-pointer flex-col gap-2 p-2 text-left hover:bg-muted focus:outline-none sm:flex-row sm:items-center sm:justify-between sm:gap-0 ${
                              focusedInvoiceIndex === index
                                ? "bg-muted ring-1 ring-ring"
                                : ""
                            }`}
                            id={`manual-payment-invoice-option-${invoiceOption.value}`}
                            key={invoiceOption.value}
                            role="option"
                            tabIndex={focusedInvoiceIndex === index ? 0 : -1}
                            type="button"
                            onClick={() => {
                              selectInvoiceOption(invoiceOption);
                            }}
                            onMouseEnter={() => setFocusedInvoiceIndex(index)}
                          >
                            <span className="w-full py-2 pr-0 pl-0 sm:w-2/6 sm:py-3 sm:pr-2">
                              <span className="block truncate text-sm font-medium leading-5 text-foreground">
                                {invoiceOption.label}
                              </span>
                              <span className="block pt-1 text-sm font-normal leading-5 text-muted-foreground">
                                {invoiceOption.invoiceNumber}
                              </span>
                            </span>
                            <span className="w-full px-0 py-2 sm:w-2/6 sm:px-2 sm:py-3 sm:text-right">
                              <span className="block text-base font-bold leading-5 text-foreground">
                                {baseCurrency &&
                                  currencyFormat(
                                    baseCurrency,
                                    invoiceOption.amount
                                  )}
                              </span>
                              <span className="block pt-1 text-sm font-medium leading-5 text-muted-foreground">
                                {dayjs(invoiceOption.invoiceDate).format(
                                  dateFormat
                                )}
                              </span>
                            </span>
                            <span className="w-full py-1 pl-0 pr-0 text-sm font-semibold leading-4 tracking-wider sm:w-2/6 sm:py-3 sm:pl-2 sm:text-right">
                              <Badge
                                className={`${getStatusCssClass(
                                  invoiceOption.status
                                )} uppercase`}
                                text={invoiceOption.status}
                              />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                  inputBoxClassName="cursor-pointer bg-background text-foreground"
                  label={i18n.t("payments.transactionDate")}
                  labelClassName="absolute top-0.5 left-1 h-6 z-1 origin-0 bg-background p-2 text-base font-medium duration-300 text-muted-foreground"
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
                <div
                  className="field relative"
                  ref={wrapperDesktopTransactionTypeRef}
                >
                  <button
                    aria-label={i18n.t("payments.transactionType")}
                    aria-expanded={showDesktopTransactionTypes}
                    aria-haspopup="listbox"
                    className="flex h-12 w-full items-center justify-between rounded-md border border-border bg-background px-4 text-left text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    type="button"
                    onClick={() =>
                      setShowDesktopTransactionTypes(previous => !previous)
                    }
                  >
                    <span
                      className={
                        transactionType
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {selectedTransactionType?.label ||
                        i18n.t("payments.selectTransactionTypeBtn")}
                    </span>
                    <CaretDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        showDesktopTransactionTypes ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {showDesktopTransactionTypes && (
                    <ul
                      className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg"
                      role="listbox"
                    >
                      {transactionTypes.map(type => (
                        <li key={type.value}>
                          <button
                            aria-selected={transactionType === type.value}
                            className={`flex w-full items-center rounded-sm px-3 py-2 text-left text-sm ${
                              transactionType === type.value
                                ? "bg-muted font-medium text-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                            role="option"
                            type="button"
                            onClick={() => {
                              setFieldValue("transactionType", type.value);
                              setShowDesktopTransactionTypes(false);
                            }}
                          >
                            {type.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  <CustomReactSelect
                    isDisabled
                    label={i18n.t("payments.transactionType")}
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
                id="paymentAmount"
                inputBoxClassName="form__input block h-12 w-full appearance-none border-border bg-background p-4 text-base text-foreground focus-within:border-primary"
                label={i18n.t("payments.paymentAmount")}
                labelClassName="absolute top-0.5 left-1 h-6 z-1 origin-0 bg-background p-2 text-base font-medium duration-300 text-muted-foreground"
                min="0"
                name="paymentAmount"
                step="0.01"
                type="number"
                value={amount ?? ""}
                onChange={e => setFieldValue("amount", e.target.value)}
              />
            </div>
            <div className="mt-4">
              <CustomTextareaAutosize
                id="NotesOptional"
                label={i18n.t("payments.notesOptional")}
                maxRows={12}
                name="NotesOptional"
                rows={5}
                value={note}
                onChange={e => setFieldValue("note", e.target.value)}
              />
            </div>
            <div className="actions mx-auto mt-4 mb-4 w-full">
              <button
                disabled={!isPaymentBtnActive() || isLoading}
                type="submit"
                className={
                  isPaymentBtnActive() && !isLoading
                    ? "focus:outline-none flex h-10 w-full cursor-pointer items-center justify-center rounded border border-transparent bg-primary py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "focus:outline-none flex h-10 w-full cursor-not-allowed items-center justify-center rounded border border-transparent bg-secondary py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-secondary-foreground opacity-80 shadow-sm"
                }
              >
                {i18n.t("payments.addPayment")}
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default PaymentEntryForm;
