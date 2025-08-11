import React, { useState, useRef, useEffect } from "react";

import payment from "apis/payments/payments";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { transactionTypes } from "components/payments/Modals/constants";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { currencyFormat, useOutsideClick } from "helpers";
import { mapPayment } from "mapper/payment.mapper";
import { CalendarIcon, XIcon } from "miruIcons";
import { Button, MobileMoreOptions, Modal, Toastr } from "StyledComponents";

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
  const [note, setNote] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [showTransactionTypes, setShowTransactionTypes] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wrapperSelectRef = useRef(null);
  const wrapperCalendartRef = useRef(null);
  const amount = invoice?.amount;
  const client = invoice?.client?.name;

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setShowDatePicker({ visibility: false });
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  useOutsideClick(wrapperCalendartRef, () => {
    setShowDatePicker({ visibility: false });
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
    Toastr.success("Invoice marked as paid successfully");
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
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showManualEntryModal}
      onClose={() => setShowManualEntryModal(false)}
    >
      <div className="modal__position m-0">
        <h6 className="modal__title"> Mark Invoice As Paid</h6>
        <div className="modal__close">
          <button
            className="modal__button"
            onClick={() => setShowManualEntryModal(false)}
          >
            <XIcon color="#CDD6DF" size={15} />
          </button>
        </div>
      </div>
      <div className="relative mt-4">
        <div className="field">
          <div className="mt-1" id="invoice" ref={wrapperSelectRef}>
            <CustomInputText
              disabled
              id="invoice"
              inputBoxClassName="form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000 border-miru-gray-1000 cursor-not-allowed"
              label="Invoice"
              labelClassName="absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300 text-miru-dark-purple-200"
              name="invoice"
              type="text"
              value={client}
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
            inputBoxClassName="cursor-pointer"
            label="Transaction Date"
            name="transactionDate"
            type="text"
            value={transactionDate && dayjs(transactionDate).format(dateFormat)}
            onChange={() => {}}  
          />
          <CalendarIcon
            className="absolute top-0 bottom-0 right-1 mx-2 my-3 cursor-pointer "
            color="#5B34EA"
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
              value={transactionTypes.find(
                type => type.value == transactionType
              )}
              onMenuOpen={() => {
                setShowTransactionTypes(true);
              }}
            />
            <MobileMoreOptions
              className="h-3/4 w-full overflow-scroll md:h-3/5 md:w-3/4 lg:h-1/4"
              setVisibilty={setShowTransactionTypes}
              visibilty={showTransactionTypes}
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
          </>
        )}
      </div>
      <div className="mt-4">
        <CustomInputText
          disabled
          id="paymentAmount"
          inputBoxClassName="form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000 border-miru-gray-1000 cursor-not-allowed"
          label="Payment amount"
          labelClassName="absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300 text-miru-dark-purple-200"
          name="paymentAmount"
          type="text"
          value={amount && baseCurrency && currencyFormat(baseCurrency, amount)}
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
          onChange={e => setNote(e.target.value)}
        />
      </div>
      <div className="actions mx-auto mt-4 mb-4 w-full">
        {invoice && transactionDate && transactionType && amount ? (
          <Button
            className="focus:outline-none flex h-10 w-full cursor-pointer items-center justify-center rounded border border-transparent bg-miru-han-purple-1000 py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-miru-white-1000 shadow-sm hover:bg-miru-han-purple-600"
            disabled={isLoading}
            size="medium"
            type="submit"
            onClick={() => {
              setIsLoading(true);
              handleAddPayment();
            }}
          >
            MARK AS PAID
          </Button>
        ) : (
          <Button
            disabled
            className="focus:outline-none flex h-10 w-full cursor-not-allowed items-center justify-center rounded border border-transparent bg-miru-gray-1000 py-1 px-4 font-sans text-base font-medium uppercase tracking-widest text-miru-white-1000 shadow-sm"
            size="medium"
            type="submit"
          >
            MARK AS PAID
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default MarkInvoiceAsPaidModal;
