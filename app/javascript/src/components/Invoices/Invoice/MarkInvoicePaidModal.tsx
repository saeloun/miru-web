import React, { useState, useRef, useEffect } from "react";
import { CaretDown } from "phosphor-react";

import { payment } from "apis/api";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { transactionTypes } from "components/payments/Modals/constants";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { currencyFormat, useOutsideClick } from "helpers";
import { mapPayment } from "mapper/payment.mapper";
import { CalendarIcon, XIcon } from "miruIcons";
import { Button, MobileMoreOptions, Modal, Toastr } from "StyledComponents";
import { i18n } from "../../../i18n";

const MarkInvoiceAsPaidModal = ({
  invoice,
  baseCurrency,
  dateFormat,
  showManualEntryModal,
  setShowManualEntryModal,
  fetchInvoice,
}) => {
  const { isDesktop } = useUserContext();
  const [transactionDate, setTransactionDate] = useState<any>(dayjs());
  const [transactionType, setTransactionType] = useState<any>(null);
  const [note, setNote] = useState<any>("");
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [showTransactionTypes, setShowTransactionTypes] =
    useState<boolean>(false);

  const [showDesktopTransactionTypes, setShowDesktopTransactionTypes] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wrapperInvoiceRef = useRef(null);
  const wrapperCalendartRef = useRef(null);
  const wrapperDesktopTransactionTypeRef = useRef(null);
  const amount = invoice?.amount;
  const client = invoice?.client?.name;
  const selectedTransactionType = transactionTypes.find(
    type => type.value === transactionType
  );

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setShowDatePicker({ visibility: false });
        setShowDesktopTransactionTypes(false);
        setShowTransactionTypes(false);
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (!showManualEntryModal) {
      setShowDesktopTransactionTypes(false);
      setShowTransactionTypes(false);
    }
  }, [showManualEntryModal]);

  useOutsideClick(wrapperCalendartRef, () => {
    setShowDatePicker({ visibility: false });
  });

  useOutsideClick(wrapperDesktopTransactionTypeRef, () => {
    setShowDesktopTransactionTypes(false);
  });

  const handleAddPayment = async () => {
    const sanitized = mapPayment({
      invoice,
      transactionDate,
      transactionType,
      amount,
      note,
    });
    await payment.create(sanitized);
    Toastr.success(i18n.t("invoices.invoiceMarkedAsPaid"));
    setIsLoading(false);
    setShowManualEntryModal(false);
    fetchInvoice();
  };

  const handleDatePicker = date => {
    setTransactionDate(date);
    setShowDatePicker(false);
  };

  return (
    <Modal
      customStyle="!bg-background text-foreground sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible border border-border"
      isOpen={showManualEntryModal}
      onClose={() => setShowManualEntryModal(false)}
    >
      <div className="modal__position m-0">
        <h6 className="modal__title text-foreground">
          {" "}
          {i18n.t("invoices.markInvoiceAsPaid")}
        </h6>
        <div className="modal__close">
          <button
            className="modal__button text-muted-foreground hover:text-foreground"
            onClick={() => setShowManualEntryModal(false)}
          >
            <XIcon color="currentColor" size={15} />
          </button>
        </div>
      </div>
      <div className="relative mt-4">
        <div className="field">
          <div className="mt-1" id="invoice" ref={wrapperInvoiceRef}>
            <CustomInputText
              disabled
              id="invoice"
              inputBoxClassName="form__input block h-12 w-full cursor-not-allowed appearance-none border-border bg-muted/40 p-4 text-base text-muted-foreground focus-within:border-primary"
              label={i18n.t("invoices.invoice")}
              labelClassName="absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-base font-medium text-muted-foreground duration-300"
              name="invoice"
              type="text"
              value={client}
              wrapperClassName="outline-none relative h-12"
              onChange={() => {}}
            />
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
            inputBoxClassName="form__input block h-12 w-full cursor-pointer appearance-none border-border !bg-background p-4 text-base !text-foreground focus-within:border-primary"
            label={i18n.t("payments.transactionDate")}
            labelClassName="absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-base font-medium text-muted-foreground duration-300"
            name="transactionDate"
            type="text"
            value={transactionDate && dayjs(transactionDate).format(dateFormat)}
            wrapperClassName="outline-none relative h-12"
            onChange={() => {}}
          />
          <CalendarIcon
            className="absolute top-0 bottom-0 right-1 mx-2 my-3 cursor-pointer "
            color="#5E58F1"
            size={20}
          />
        </div>
        {showDatePicker.visibility && (
          <CustomDatePicker
            date={transactionDate || dayjs()}
            handleChange={handleDatePicker}
          />
        )}
      </div>
      <div className="relative mt-4">
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
                  transactionType ? "text-foreground" : "text-muted-foreground"
                }
              >
                {selectedTransactionType?.label ||
                  i18n.t("payments.selectTransactionType")}
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
                      className={`flex w-full items-center rounded-sm px-3 py-2 text-left text-sm ${
                        transactionType === type.value
                          ? "bg-muted font-medium text-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                      type="button"
                      onClick={() => {
                        setTransactionType(type.value);
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
            <div className="field relative">
              <label className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-background px-1 text-xsm font-medium text-muted-foreground duration-300">
                {i18n.t("payments.transactionType")}
              </label>
              <div
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                onClick={() => setShowTransactionTypes(true)}
              >
                <span
                  className={`${
                    transactionType ? "" : "text-muted-foreground"
                  }`}
                >
                  {transactionType
                    ? transactionTypes.find(
                        type => type.value == transactionType
                      )?.label
                    : i18n.t("payments.selectTransactionType")}
                </span>
              </div>
            </div>
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
                      setTransactionType(transaction.value);
                    }
                    setShowTransactionTypes(false);
                  }}
                >
                  {transaction.label}
                </li>
              ))}
            </MobileMoreOptions>
          </>
        )}
      </div>
      <div className="mt-4">
        <CustomInputText
          disabled
          id="paymentAmount"
          inputBoxClassName="form__input block h-12 w-full cursor-not-allowed appearance-none border-border bg-muted/40 p-4 text-base text-muted-foreground focus-within:border-primary"
          label={i18n.t("payments.paymentAmount")}
          labelClassName="absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-base font-medium text-muted-foreground duration-300"
          name="paymentAmount"
          type="text"
          value={amount && baseCurrency && currencyFormat(baseCurrency, amount)}
          wrapperClassName="outline-none relative h-12"
          onChange={() => {}}
        />
      </div>
      <div className="mt-4">
        <CustomTextareaAutosize
          id="NotesOptional"
          inputBoxClassName="form__input block h-16 w-full appearance-none border-border !bg-background p-4 text-sm !text-foreground lg:text-base"
          label={i18n.t("payments.notesOptional")}
          maxRows={12}
          name="NotesOptional"
          rows={5}
          value={note}
          wrapperClassName="outline-none relative [&>span]:bg-background [&>span]:text-muted-foreground"
          onChange={e => setNote(e.target.value)}
        />
      </div>
      <div className="actions mx-auto mt-4 mb-4 w-full">
        {invoice && transactionDate && transactionType && amount ? (
          <Button
            className="focus:outline-none flex h-10 w-full cursor-pointer items-center justify-center rounded border border-transparent bg-primary py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary/90"
            disabled={isLoading}
            size="medium"
            type="submit"
            onClick={() => {
              setIsLoading(true);
              handleAddPayment();
            }}
          >
            {i18n.t("invoices.markAsPaid").toUpperCase()}
          </Button>
        ) : (
          <Button
            disabled
            className="focus:outline-none flex h-10 w-full cursor-not-allowed items-center justify-center rounded border border-transparent bg-secondary py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-primary-foreground shadow-sm"
            size="medium"
            type="submit"
          >
            {i18n.t("invoices.markAsPaid").toUpperCase()}
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default MarkInvoiceAsPaidModal;
