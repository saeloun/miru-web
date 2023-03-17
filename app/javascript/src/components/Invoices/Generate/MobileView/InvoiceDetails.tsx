import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { Formik, Form, FormikProps } from "formik";
import { useOutsideClick } from "helpers";
import { SearchIcon, CalendarIcon, CaretDownIcon } from "miruIcons";
import Select, { components, DropdownIndicatorProps } from "react-select";

import { CustomAdvanceInput } from "common/CustomAdvanceInput";
import CustomDatePicker from "common/CustomDatePicker";
import { InputErrors, InputField } from "common/FormikFields";
import { reactSelectStyles } from "components/Invoices/common/InvoiceDetails/Styles";

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
}) => {
  const [isClientVisible, setIsClientVisible] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  const [showDateOfIssuePicker, setShowDateOfIssuePicker] =
    useState<boolean>(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const DueDateWrapper = useRef(null);
  const DateOfIssueWrapper = useRef(null);

  const getIssuedDate = dayjs(issueDate).format(dateFormat);
  const getDueDate = dayjs(dueDate).format(dateFormat);

  const handleDatePickerChange = date => {
    setIssueDate(date);
    setShowDateOfIssuePicker(false);
    const newDueDate = new Date(date);
    setDueDate(new Date(newDueDate.setMonth(newDueDate.getMonth() + 1)));
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

  return (
    <Formik
      initialValues={{
        billedTo: "",
        issueDate: "",
        dueDate: "",
        invoiceNumber: "",
        referenceNumber: "",
      }}
      onSubmit={() => {}} // eslint-disable-line
      validateOnBlur={false}
      validationSchema=""
    >
      {(props: FormikProps<SignInFormValues>) => {
        const { touched, errors } = props;

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
                inputBoxClassName="min-h-80"
                label="Billed to"
                wrapperClassName="h-full"
                value={
                  selectedClient && (
                    <div>
                      <p className="text-sm font-medium text-miru-dark-purple-1000">
                        {selectedClient.label}
                      </p>
                      <p className="w-52 text-xs font-medium text-miru-dark-purple-600">
                        {selectedClient.address}
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
                <div className="h-1/2 w-full" ref={wrapperRef}>
                  <Select
                    defaultMenuIsOpen
                    isSearchable
                    className="w-full text-white"
                    classNamePrefix="m-0 truncate font-medium text-sm text-miru-dark-purple-1000 bg-white"
                    defaultValue={null}
                    options={invoiceDetails.clientList}
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
              <div
                className="relative w-fit cursor-pointer"
                ref={DateOfIssueWrapper}
                onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
              >
                <InputField
                  readOnly
                  id="Date of Issue"
                  inputBoxClassName="focus:border-miru-han-purple-1000"
                  label="Date of Issue"
                  name="Date of Issue"
                  type="text"
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
                {showDateOfIssuePicker && (
                  <div
                    className="modal__modal main-modal "
                    style={{ background: "rgba(29, 26, 49,0.6)" }}
                  >
                    <div className="absolute inset-0 m-auto h-72 w-3/4">
                      <CustomDatePicker
                        date={issueDate}
                        handleChange={handleDatePickerChange}
                        setVisibility={setShowDateOfIssuePicker}
                        wrapperRef={DateOfIssueWrapper}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div
                className="relative w-fit cursor-pointer"
                ref={DueDateWrapper}
                onClick={() => setShowDueDatePicker(!showDueDatePicker)}
              >
                <InputField
                  readOnly
                  id="Due Date"
                  inputBoxClassName="focus:border-miru-han-purple-1000"
                  label="Due Date"
                  name="Due Date"
                  type="text"
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
                {showDueDatePicker && (
                  <div
                    className="modal__modal main-modal "
                    style={{ background: "rgba(29, 26, 49,0.6)" }}
                  >
                    <div className="absolute inset-0 m-auto h-72 w-3/4">
                      <CustomDatePicker
                        date={dueDate}
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
                id="Invoice Number"
                inputBoxClassName="border focus:border-miru-han-purple-1000"
                label="Invoice Number"
                name="Invoice Number"
                readOnly={false}
                type="text"
                value={invoiceNumber}
                wrapperClassName="mr-2"
                onChange={e => setInvoiceNumber(e.target.value)}
              />
              <InputErrors
                fieldErrors={errors.invoiceNumber}
                fieldTouched={touched.invoiceNumber}
              />
              <InputField
                id="Reference"
                inputBoxClassName="focus:border-miru-han-purple-1000"
                label="Reference"
                name="Reference"
                readOnly={false}
                type="text"
                value={reference}
                wrapperClassName="ml-2"
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
