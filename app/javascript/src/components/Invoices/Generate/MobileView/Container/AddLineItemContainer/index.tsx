import React, { useState, useRef, useEffect } from "react";

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
import { Button } from "StyledComponents";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { InputErrors, InputField } from "common/FormikFields";
import NewLineItemTable from "components/Invoices/common/NewLineItemTable";
import { fetchNewLineItems } from "components/Invoices/common/utils";

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
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rate, setRate] = useState<number>();
  const [quantity, setQuantity] = useState<any>();
  const [qtyInHHrMin, setQtyInHHrMin] = useState<any>(
    quantity && minToHHMM(quantity)
  );
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
  const getDate = date ? dayjs(date).format(dateFormat) : null;
  const disableBtn = name && description && date && rate && quantity;
  const debouncedSearchName = useDebounce(name, 500);

  useEffect(() => {
    setLineItem({
      ...lineItem,
      id: manualEntryArr.length + 1,
      name,
      date,
      description,
      rate,
      quantity,
      lineTotal,
    });
  }, [name, date, description, rate, quantity, lineTotal]);

  useEffect(() => {
    if (editItem.id || editItem.timesheet_entry_id) {
      setLineItem({ id: editItem.id, ...lineItem });
      setName(editItem.name || editItem.first_name);
      setDate(editItem.date);
      setDescription(editItem.description);
      setRate(editItem.rate);
      const quantityInMin = Number(minFromHHMM(editItem.quantity.toString()));
      setQuantity(quantityInMin);
      setQtyInHHrMin(editItem.quantity);
    }
  }, [editItem]);

  useEffect(() => {
    if (rate && quantity) setLineTotal(lineTotalCalc(quantity, rate));
  }, [rate, quantity]);

  const handleDatePicker = selectedDate => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleAddLineItem = () => {
    setManualEntryArr([...manualEntryArr, lineItem]);
    setActiveSection(sections.generateInvoice);
  };

  const handleSetRate = e => {
    setRate(e.target.value);
    setLineTotal(lineTotalCalc(quantity, e.target.value));
  };

  const handleSetQuantity = e => {
    const quantityInMin = Number(minFromHHMM(e.target.value));
    setQtyInHHrMin(e.target.value);
    setQuantity(quantityInMin);
    setLineTotal(lineTotalCalc(quantityInMin, rate));
  };

  const loadNewLineItems = () => {
    fetchNewLineItems(selectedClient, setLineItems, selectedLineItems);
  };

  useEffect(() => {
    loadNewLineItems();
  }, []);

  useOutsideClick(
    newLineTableRef,
    () => {
      setShowNewLineItemTable(false);
    },
    showNewLineItemTable
  );

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
        return {
          ...option,
          first_name: name,
          date,
          description,
          rate,
          quantity: qtyInHHrMin,
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
        return {
          ...option,
          first_name: name,
          date,
          description,
          rate,
          quantity: qtyInHHrMin,
          lineTotal,
        };
      }

      return option;
    });

    setSelectedLineItems(updatedSelectedLineItems);
    setEditItem({});
    setActiveSection(sections.generateInvoice);
  };

  interface AddLineItemFormValues {
    name: string;
    notes: string;
    date: string;
    rate: number;
    quantity: number;
  }

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

  return (
    <div className="h-full p-4">
      <Formik
        initialValues={{
          name: "",
          notes: "",
          date: "",
          rate,
          quantity,
        }}
        onSubmit={() => {}} // eslint-disable-line
        validateOnBlur={false}
        validationSchema=""
      >
        {(props: FormikProps<AddLineItemFormValues>) => {
          const { touched, errors } = props;

          return (
            <Form className="flex h-full flex-col justify-between">
              <div className="relative flex h-full flex-col">
                <div ref={newLineTableRef}>
                  <div
                    className="py-2"
                    onClick={() => {
                      setShowNewLineItemTable(true);
                    }}
                  >
                    <InputField
                      autoComplete="off"
                      id="Name"
                      inputBoxClassName="border focus:border-miru-han-purple-1000"
                      label="Name"
                      name="Name"
                      readOnly={false}
                      setFieldValue={name}
                      type="text"
                      onChange={e => setName(e.target.value)}
                    />
                    <InputErrors
                      fieldErrors={errors.name}
                      fieldTouched={touched.name}
                    />
                  </div>
                  {showNewLineItemTable && (
                    <div className="absolute z-50 h-148 w-full rounded-md bg-white pb-4 shadow-lg">
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
                </div>
                <div className="py-2">
                  <CustomTextareaAutosize
                    id="Note"
                    label="Note"
                    maxRows={12}
                    name="Note"
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <InputErrors
                    fieldErrors={errors.notes}
                    fieldTouched={touched.notes}
                  />
                </div>
                <div className="py-2">
                  <div
                    className="relative"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <InputField
                      readOnly
                      id="Date"
                      inputBoxClassName="border focus:border-miru-han-purple-1000"
                      label="Date"
                      name="Date"
                      setFieldValue={getDate}
                      type="text"
                      onChange={e => setDate(e.target.value)}
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
                <div className="py-2">
                  <InputField
                    id="Rate"
                    inputBoxClassName="border focus:border-miru-han-purple-1000"
                    label="Rate"
                    name="Rate"
                    readOnly={false}
                    setFieldValue={rate}
                    type="text"
                    onChange={handleSetRate}
                  />
                  <InputErrors
                    fieldErrors={errors.rate}
                    fieldTouched={touched.rate}
                  />
                </div>
                <div className="py-2">
                  <InputField
                    id="Quantity"
                    inputBoxClassName="border focus:border-miru-han-purple-1000"
                    label="Quantity"
                    name="Quantity"
                    readOnly={false}
                    setFieldValue={qtyInHHrMin}
                    type="text"
                    onChange={handleSetQuantity}
                  />
                  <InputErrors
                    fieldErrors={errors.quantity}
                    fieldTouched={touched.quantity}
                  />
                </div>
              </div>
              {editItem.id || editItem.timesheet_entry_id ? (
                <div className="flex w-full justify-between">
                  <Button
                    className="mr-2 flex w-1/2 items-center justify-center rounded border border-miru-red-400 px-4 py-2"
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
                    style="primary"
                    onClick={handleEdit}
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
                  disabled={!disableBtn}
                  style="primary"
                  onClick={handleAddLineItem}
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
