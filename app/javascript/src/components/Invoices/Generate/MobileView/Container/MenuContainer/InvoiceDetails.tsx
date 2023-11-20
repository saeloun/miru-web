import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { Formik, Form, FormikProps } from "formik";
import { useOutsideClick } from "helpers";
import { SearchIcon, CalendarIcon, CaretDownIcon } from "miruIcons";
import Select, { components, DropdownIndicatorProps } from "react-select";

import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { InputErrors, InputField } from "common/FormikFields";
import { reactSelectStyles } from "components/Invoices/common/InvoiceDetails/Styles";

import { invoiceDetailsFormInitialValues, invoiceDetailsSchema } from "./utils";

const InvoiceDetails = ({
  dueDate,
  issueDate,
  invoiceDetails,
  invoiceNumber,
  reference,
  selectedClient,
  setReference,
  setSelectedClient,
  dateFormat,
  setDueDate,
  setIssueDate,
  setInvoiceNumber,
  handleSaveInvoice,
}) => {
  const [isClientVisible, setIsClientVisible] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  const [showDateOfIssuePicker, setShowDateOfIssuePicker] =
    useState<boolean>(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const DueDateWrapper = useRef(null);
  const DateOfIssueWrapper = useRef(null);

  const getIssuedDate = dayjs(issueDate, dateFormat).format(dateFormat);
  const getDueDate = dayjs(dueDate, dateFormat).format(dateFormat);
  const { clientList, companyClientList } = invoiceDetails;
  const handleDatePickerChange = date => {
    setIssueDate(date);
    setShowDateOfIssuePicker(false);
    const parsedDate = dayjs(date, dateFormat);
    const newDueDate = parsedDate.add(1, "month").format(dateFormat);
    setDueDate(newDueDate);
  };

  const handleDueDatePicker = date => {
    setDueDate(date);
    setShowDueDatePicker(false);
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <SearchIcon color="#1D1A31" size={20} />
    </components.DropdownIndicator>
  );

  const handleClientChange = selection => {
    setSelectedClient(selection);
    setIsClientVisible(false);
  };

  useOutsideClick(wrapperRef, () => setIsClientVisible(false), isClientVisible);
  interface SignInFormValues {
    billedTo: string;
    issueDate: string;
    dueDate: string;
    invoiceNumber: string;
    referenceNumber: string;
  }
  const { address_line_1, address_line_2, city, state, country, pin } =
    selectedClient?.address ?? {};

  return (
    <Formik
      initialValues={invoiceDetailsFormInitialValues(invoiceNumber, reference)}
      validateOnBlur={false}
      validationSchema={invoiceDetailsSchema}
      onSubmit={handleSaveInvoice}
    >
      {(props: FormikProps<SignInFormValues>) => {
        const { touched, errors, setFieldValue, setFieldError } = props;

        return (
          <Form>
            <div
              className="relative py-3"
              onClick={() => {
                setIsClientVisible(!isClientVisible);
              }}
            >
              <CustomAdvanceInput
                id="Billed to"
                inputBoxClassName="min-h-80 max-h-20v overflow-y-scroll"
                label="Billed to"
                wrapperClassName="h-full"
                value={
                  selectedClient && (
                    <div>
                      <p className="text-sm font-medium text-miru-dark-purple-1000">
                        {selectedClient.label}
                      </p>
                      <p className="w-52 py-2 text-xs font-medium text-miru-dark-purple-600">
                        {`${address_line_1}${
                          address_line_2 ? `, ${address_line_2}` : ""
                        }\n ${
                          address_line_2 ? "," : ""
                        }\n ${city}, ${state}, ${country},\n ${pin}`}
                        <br />
                        {selectedClient.phone}
                      </p>
                    </div>
                  )
                }
              />
              <CaretDownIcon
                className="absolute top-6 right-2 text-miru-han-purple-1000"
                size={16}
                weight="bold"
              />
            </div>
            {isClientVisible && (
              <div
                className="modal__modal main-modal "
                style={{ background: "rgba(29, 26, 49,0.6)" }}
              >
                <div className="h-auto w-full" ref={wrapperRef}>
                  <Select
                    autoFocus
                    defaultMenuIsOpen
                    isSearchable
                    className="w-full text-white"
                    classNamePrefix="m-0 truncate font-medium text-sm text-miru-dark-purple-1000 bg-white"
                    defaultValue={null}
                    options={clientList || companyClientList}
                    placeholder="Search"
                    styles={reactSelectStyles.InvoiceDetails}
                    components={{
                      DropdownIndicator,
                      IndicatorSeparator: () => null,
                    }}
                    onChange={handleClientChange}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between py-3">
              <div className="relative w-1/2 cursor-pointer">
                <div
                  onClick={() =>
                    setShowDateOfIssuePicker(!showDateOfIssuePicker)
                  }
                >
                  <CustomInputText
                    readOnly
                    id="Date of Issue"
                    inputBoxClassName="focus:border-miru-han-purple-1000"
                    label="Date of Issue"
                    name="Date of Issue"
                    value={getIssuedDate}
                    wrapperClassName="mr-2"
                    onChange={handleDatePickerChange}
                  />
                  <InputErrors
                    fieldErrors={errors.issueDate}
                    fieldTouched={touched.issueDate}
                  />
                  <CalendarIcon
                    className="absolute top-4 right-4"
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showDateOfIssuePicker && (
                  <div
                    className="modal__modal main-modal "
                    style={{ background: "rgba(29, 26, 49,0.6)" }}
                  >
                    <div
                      className="absolute inset-0 m-auto h-72 w-3/4"
                      ref={DateOfIssueWrapper}
                    >
                      <CustomDatePicker
                        date={issueDate}
                        dateFormat={dateFormat}
                        handleChange={handleDatePickerChange}
                        setVisibility={setShowDateOfIssuePicker}
                        wrapperRef={DateOfIssueWrapper}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="relative w-1/2 cursor-pointer">
                <div onClick={() => setShowDueDatePicker(!showDueDatePicker)}>
                  <CustomInputText
                    readOnly
                    id="Due Date"
                    inputBoxClassName="focus:border-miru-han-purple-1000"
                    label="Due Date"
                    name="Due Date"
                    value={getDueDate}
                    wrapperClassName="ml-2"
                    onChange={handleDueDatePicker}
                  />
                  <InputErrors
                    fieldErrors={errors.dueDate}
                    fieldTouched={touched.dueDate}
                  />
                  <CalendarIcon
                    className="absolute top-4 right-4"
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showDueDatePicker && (
                  <div
                    className="modal__modal main-modal "
                    style={{ background: "rgba(29, 26, 49,0.6)" }}
                  >
                    <div
                      className="absolute inset-0 m-auto h-72 w-3/4"
                      ref={DueDateWrapper}
                    >
                      <CustomDatePicker
                        date={dueDate}
                        dateFormat={dateFormat}
                        handleChange={handleDueDatePicker}
                        setVisibility={setShowDueDatePicker}
                        wrapperRef={DueDateWrapper}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between py-3">
              <InputField
                id="invoiceNumber"
                inputBoxClassName="border focus:border-miru-han-purple-1000"
                label="Invoice Number"
                name="invoiceNumber"
                setFieldError={setFieldError}
                setFieldValue={setFieldValue}
                type="text"
                wrapperClassName="mr-2 w-1/2"
                onChange={e => setInvoiceNumber(e.target.value)}
              />
              <InputErrors
                fieldErrors={errors.invoiceNumber}
                fieldTouched={touched.invoiceNumber}
              />
              <InputField
                id="referenceNumber"
                inputBoxClassName="focus:border-miru-han-purple-1000"
                label="Reference"
                name="referenceNumber"
                setFieldError={setFieldError}
                setFieldValue={setFieldValue}
                type="text"
                wrapperClassName="ml-2 w-1/2"
                onChange={e => setReference(e.target.value)}
              />
              <InputErrors
                fieldErrors={errors.referenceNumber}
                fieldTouched={touched.referenceNumber}
              />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default InvoiceDetails;
