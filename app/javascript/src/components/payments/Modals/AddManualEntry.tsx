/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Select, { DropdownIndicatorProps, components } from "react-select";
import CustomDatePicker from "common/CustomDatePicker";
import dayjs from "dayjs";
import { X, Calendar } from "phosphor-react";
import { MagnifyingGlass } from "phosphor-react";

const AddManualEntry = ({ setShowManualEntryModal }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [transcationDate, setTranscationDate] = useState<any>(null);
  const [transcationType, setTranscationType] = useState<any>(null);
  const [amount, setAmount] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<any>(false);
  const [isOpen, setOpen] = useState<any>(false);

  const handleDatePicker = (date) => {
    const formattedDate = dayjs(date).format("DD.MM.YYYY");
    setTranscationDate(formattedDate);
    setShowDatePicker(false);
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      {isOpen && <MagnifyingGlass size={20} color="#1D1A31" />}
    </components.DropdownIndicator>
  );

  const CustomOption = (props) => {
    const { innerProps, innerRef } = props;
    return (
      <div ref={innerRef} {...innerProps} className=" p-2 flex justify-between items-center">
        <div className="pr-6 pl-0 py-2.5 text-left">
          <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
            {props.data.label}
          </h1>
          <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
                      CB680
          </h3>
        </div>
        <div className="px-6 py-2.5 text-left">
          <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
                      $275.43
          </h1>
          <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
                      07.07.2022
          </h3>
        </div>
        <div className="pl-6 pr-0 py-2.5 text-sm font-semibold tracking-wider leading-4 text-right">
          <span className="bg-miru-alert-green-400 text-miru-alert-green-800 rounded-lg px-1">
                      Sent
          </span>
        </div>
      </div>
    );
  };

  const Invoiceoptions = [{ options: [], value: "invoice1", label: "Invoice1" }];

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
                    options={Invoiceoptions}
                    placeholder="Search by client name or invoice ID"
                    isSearchable={true}
                    className="m-0 mt-2 w-full text-miru-dark-purple-1000 border-0 bg-miru-gray-100 focus:outline-none"
                    classNamePrefix="bg-miru-gray-100 border-0 text-miru-dark-purple-1000 focus:outline-none"
                    components={{
                      DropdownIndicator,
                      IndicatorSeparator: () => null,
                      Option: CustomOption
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Transcation Date
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
                    value={transcationDate}
                  />
                  <Calendar
                    size={20}
                    className="absolute top-0 right-0 m-2"
                    color="#5B34EA"
                  />
                  {showDatePicker && (
                    <CustomDatePicker
                      handleChange={handleDatePicker}
                      dueDate={transcationDate}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Transcation Type
                  </label>
                </div>
                <div className="mt-1">
                  <select className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base">
                    <option value="" disabled hidden selected className="text-miru-gray-100">Select</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="ACH">ACH</option>
                    <option value="Amex">Amex</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit">Debit</option>
                    <option value="PayPal">PayPal</option>
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
                    placeholder="Payment Amount"
                    className="rounded appearance-none border-0 block w-full px-3 py-2 bg-miru-gray-100 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="actions mt-4">
              {invoice && transcationDate && transcationType && amount ? (
                <button
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
