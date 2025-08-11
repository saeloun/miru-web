import React, { useState, useRef, useEffect } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { InputErrors, InputField } from "common/FormikFields";
import NewLineItemTable from "components/Invoices/common/NewLineItemTable";
import { fetchNewLineItems } from "components/Invoices/common/utils";
import dayjs from "dayjs";
import { Formik, Form, FormikProps } from "formik";
import {
  lineTotalCalc,
  minFromHHMM,
  minToHHMM,
  useDebounce,
  useOutsideClick,
} from "helpers";
import { CalendarIcon, DeleteIcon, FloppyDiskIcon } from "miruIcons";
import { Button, TimeInput } from "StyledComponents";

import { addEditFormInitialValues, addEditFormSchema } from "./utils";

import { sections } from "../../utils";

const AddLineItemContainer = ({
  dateFormat,
  setManualEntryArr,
  manualEntryArr,
  lineItems,
  setLineItems,
  selectedLineItems,
  setSelectedLineItems,
  selectedClient,
  setActiveSection,
  multiLineItemModal,
  setMultiLineItemModal,
  editItem,
  setEditItem,
}) => {
  const [name, setName] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<number>();
  const [quantity, setQuantity] = useState<any>();
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>("");
  const [lineTotal, setLineTotal] = useState<any>();
  const [lineItem, setLineItem] = useState<any>({});
  const [filteredLineItems, setFilteredLineItems] = useState<any>();
  const [showNewLineItemTable, setShowNewLineItemTable] =
    useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const DateWrapper = useRef(null);
  const newLineTableRef = useRef(null);
  const getDate = date ? dayjs(date).format(dateFormat) : "";
  const debouncedSearchName = useDebounce(name, 500);
  const disableBtn = (values, errors) => {
    if (errors.name || errors.rate) {
      return true;
    }

    if (values.name && description && date && values.rate && quantity) {
      return false;
    }

    return true;
  };

  const handleDatePicker = selectedDate => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleSetRate = e => {
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(quantity, e.target.value));
  };

  const handleSetQuantity = val => {
    const quantityInMin = Number(minFromHHMM(val));
    setQtyInHHrMin(val);
    setQuantity(quantityInMin);
    setLineTotal(lineTotalCalc(quantityInMin, rate));
  };

  const loadNewLineItems = () => {
    fetchNewLineItems(selectedClient, setLineItems, selectedLineItems);
  };

  const handleAddLineItem = (values: any) => {
    values.date = date;
    values.description = description;
    values.quantity = quantity;
    const lineItem = { id: manualEntryArr.length + 1, ...values, lineTotal };
    setManualEntryArr([...manualEntryArr, lineItem]);
    setActiveSection(sections.generateInvoice);
  };

  const handleDelete = item => {
    const deleteItem = {
      ...item,
      _destroy: true,
    };

    const manualOptionArr = manualEntryArr.map(option => {
      if (
        (item.id && option.id === item.id) ||
        (option.timesheet_entry_id &&
          option.timesheet_entry_id === item.timesheet_entry_id)
      ) {
        return deleteItem;
      }

      return option;
    });

    const selectedOptionArr = selectedLineItems.map(option => {
      if (
        (item.id && option.id === item.id) ||
        (option.timesheet_entry_id &&
          option.timesheet_entry_id === item.timesheet_entry_id)
      ) {
        return deleteItem;
      }

      return option;
    });

    setManualEntryArr(manualOptionArr.filter(n => n));
    setSelectedLineItems(selectedOptionArr.filter(n => n));
    setEditItem({});
    setActiveSection(sections.generateInvoice);
  };

  const handleEdit = () => {
    const updatedManualEntryArr = manualEntryArr.map(option => {
      if (
        (editItem.id && option.id === editItem.id) ||
        (option.timesheet_entry_id &&
          option.timesheet_entry_id === editItem.timesheet_entry_id)
      ) {
        const first_name = name.split(" ")[0];
        const last_name = name.split(" ")[1];
        const quantityInMin = Number(minFromHHMM(qtyInHHrMin));

        return {
          ...option,
          first_name,
          last_name,
          date,
          description,
          rate,
          quantity: quantityInMin,
          lineTotal,
        };
      }

      return option;
    });
    setManualEntryArr(updatedManualEntryArr);
    const updatedSelectedLineItems = selectedLineItems.map(option => {
      if (
        (editItem.id && option.id === editItem.id) ||
        (option.timesheet_entry_id &&
          option.timesheet_entry_id === editItem.timesheet_entry_id)
      ) {
        const first_name = name.split(" ")[0];
        const last_name = name.split(" ")[1];
        const quantityInMin = Number(minFromHHMM(qtyInHHrMin));

        return {
          ...option,
          first_name,
          last_name,
          date,
          description,
          rate,
          quantity: quantityInMin,
          lineTotal,
        };
      }

      return option;
    });

    setSelectedLineItems(updatedSelectedLineItems);
    setEditItem({});
    setActiveSection(sections.generateInvoice);
  };

  const handleSubmitForm = (values: any) => {
    editItem.id || editItem.timesheet_entry_id
      ? handleEdit()
      : handleAddLineItem(values);
  };

  useOutsideClick(
    newLineTableRef,
    () => {
      setShowNewLineItemTable(false);
    },
    showNewLineItemTable
  );

  useEffect(() => {
    if (rate && quantity) setLineTotal(lineTotalCalc(quantity, rate));
  }, [rate, quantity]);

  useEffect(() => {
    if (editItem.id || editItem.timesheet_entry_id) {
      setLineItem({ id: editItem.id, ...lineItem });
      setName(editItem.name || editItem.first_name);
      const date = new Date(editItem.date);
      setDate(date);
      setDescription(editItem.description);
      setRate(editItem.rate);
      setQuantity(editItem.quantity);
      const quantityInMin = minToHHMM(editItem.quantity);
      setQtyInHHrMin(quantityInMin);
    }
  }, [editItem]);

  useEffect(() => {
    loadNewLineItems();
  }, []);

  useEffect(() => {
    if (debouncedSearchName) {
      const newLineItems = lineItems.filter(item =>
        item.first_name
          .toLowerCase()
          .includes(debouncedSearchName.toLowerCase())
      );
      setFilteredLineItems(newLineItems);
      setLoading(false);
    } else {
      setFilteredLineItems(lineItems);
      setLoading(false);
    }
  }, [debouncedSearchName, lineItems]);

  useEffect(() => {
    if (multiLineItemModal) {
      setActiveSection(sections.multipleEntries);
    }
  }, [multiLineItemModal]);

  useEffect(() => {
    if (!showMenu) {
      setActiveSection(sections.generateInvoice);
      setLineItem({});
    }
  }, [showMenu]);

  interface AddLineItemFormValues {
    name: string;
    description: string;
    date: Date;
    rate: number;
    quantity: number;
  }

  return (
    <div className="h-full p-4">
      <Formik
        initialValues={addEditFormInitialValues(editItem)}
        validateOnBlur={false}
        validationSchema={addEditFormSchema}
        onSubmit={() => {}} //eslint-disable-line
      >
        {(props: FormikProps<AddLineItemFormValues>) => {
          const { touched, errors, values, setFieldValue, setFieldError } =
            props;

          return (
            <Form className="flex h-full flex-col justify-between">
              <div className="relative flex h-full flex-col">
                <div ref={newLineTableRef}>
                  <div
                    onClick={() => {
                      setShowNewLineItemTable(true);
                    }}
                  >
                    <InputField
                      autoComplete="off"
                      id="name"
                      inputBoxClassName="border focus:border-miru-han-purple-1000"
                      label="Name"
                      name="name"
                      readOnly={false}
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="text"
                      onChange={e => setName(e.target.value)}
                    />
                    <InputErrors
                      fieldErrors={errors.name}
                      fieldTouched={touched.name}
                    />
                  </div>
                  {showNewLineItemTable && (
                    <>
                      {filteredLineItems.length > 0 && (
                        <div className="absolute z-50 h-96 w-full rounded-md bg-white pb-4 shadow-lg">
                          <NewLineItemTable
                            dateFormat={dateFormat}
                            filteredLineItems={filteredLineItems}
                            loadMoreItems={loadNewLineItems}
                            loading={loading}
                            selectedLineItems={selectedLineItems}
                            setAddNew={setShowMenu}
                            setFilteredLineItems={setFilteredLineItems}
                            setLineItem={setLineItem}
                            setLoading={setLoading}
                            setMultiLineItemModal={setMultiLineItemModal}
                            setSelectedLineItems={setSelectedLineItems}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="pb-6">
                  <CustomTextareaAutosize
                    id="description"
                    label="Note"
                    maxRows={12}
                    name="description"
                    rows={5}
                    value={description}
                    onChange={e => {
                      setDescription(e.target.value);
                      setFieldValue("description", e.target.value);
                    }}
                  />
                  <InputErrors
                    fieldErrors={errors.description}
                    fieldTouched={touched.description}
                  />
                </div>
                <div className="pb-6">
                  <div
                    className="relative"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <CustomInputText
                      readOnly
                      id="date"
                      inputBoxClassName="border focus:border-miru-han-purple-1000"
                      label="Date"
                      name="date"
                      type="text"
                      value={getDate}
                      onChange={handleDatePicker}
                    />
                    <InputErrors
                      fieldErrors={errors.date}
                      fieldTouched={touched.date}
                    />
                    <CalendarIcon
                      className="absolute top-4 right-4"
                      color="#5B34EA"
                      size={20}
                      weight="bold"
                    />
                  </div>
                  {showDatePicker && (
                    <div
                      className="modal__modal main-modal "
                      style={{ background: "rgba(29, 26, 49,0.6)" }}
                    >
                      <div
                        className="absolute inset-0 m-auto h-72 w-3/4"
                        ref={DateWrapper}
                      >
                        <CustomDatePicker
                          date={date}
                          handleChange={handleDatePicker}
                          setVisibility={setShowDatePicker}
                          wrapperRef={DateWrapper}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <InputField
                    id="rate"
                    inputBoxClassName="border focus:border-miru-han-purple-1000"
                    label="Rate"
                    name="rate"
                    readOnly={false}
                    setFieldError={setFieldError}
                    setFieldValue={setFieldValue}
                    type="text"
                    onChange={handleSetRate}
                  />
                  <InputErrors
                    fieldErrors={errors.rate}
                    fieldTouched={touched.rate}
                  />
                </div>
                <TimeInput
                  className="focus:outline-none h-10 w-full cursor-pointer rounded-md border border-miru-gray-1000 text-center text-xl font-bold text-miru-dark-purple-1000 placeholder:text-miru-dark-purple-200 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
                  initTime={qtyInHHrMin}
                  name="timeInput"
                  onTimeChange={handleSetQuantity}
                />
              </div>
              {editItem.id || editItem.timesheet_entry_id ? (
                <div className="flex w-full justify-between">
                  <Button
                    className="mr-2 flex w-1/2 items-center justify-center rounded border border-miru-red-400 px-4 py-2"
                    style="ternary"
                    onClick={() => handleDelete(editItem)}
                  >
                    <DeleteIcon
                      className="text-miru-red-400"
                      size={16}
                      weight="bold"
                    />
                    <span className="ml-2 text-center text-base font-bold leading-5 text-miru-red-400">
                      Delete
                    </span>
                  </Button>
                  <Button
                    className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
                    disabled={disableBtn(values, errors)}
                    style="primary"
                    onClick={() => handleSubmitForm(values)}
                  >
                    <FloppyDiskIcon
                      className="text-white"
                      size={16}
                      weight="bold"
                    />
                    <span className="ml-2 text-center text-base font-bold leading-5 text-white">
                      Save
                    </span>
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full p-2 text-center text-base font-bold"
                  disabled={disableBtn(values, errors)}
                  style="primary"
                  type="submit"
                  onClick={() => handleSubmitForm(values)}
                >
                  Add Line Item
                </Button>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddLineItemContainer;
