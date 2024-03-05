import React, { useRef, useState, ChangeEvent, useEffect } from "react";

import dayjs from "dayjs";
import { useOutsideClick } from "helpers";
import { CalendarIcon, FileIcon, FilePdfIcon, XIcon } from "miruIcons";
import { components } from "react-select";
import { Button } from "StyledComponents";

import expensesApi from "apis/expenses";
import CustomCreatableSelect from "common/CustomCreatableSelect";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomRadioButton from "common/CustomRadio";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { ErrorSpan } from "common/ErrorSpan";

const ExpenseForm = ({
  dateFormat,
  expenseData,
  handleFormAction,
  expense = null,
}) => {
  const wrapperCalendarRef = useRef(null);
  const fileRef = useRef(null);

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [expenseDate, setExpenseDate] = useState<any>(
    dayjs(expense?.date) || dayjs()
  );
  const [vendor, setVendor] = useState<any>("");
  const [amount, setAmount] = useState<number | string>(expense?.amount || "");
  const [category, setCategory] = useState<any>("");
  const [newCategory, setNewCategory] = useState<any>("");
  const [description, setDescription] = useState<string>(
    expense?.description || ""
  );

  const [expenseType, setExpenseType] = useState<string>(
    expense?.type || "personal"
  );
  const [receipt, setReceipt] = useState<File>(expense?.receipt || "");

  const isFormActionDisabled = !(
    expenseDate &&
    vendor &&
    amount &&
    (category || newCategory)
  );

  const { Option } = components;
  const IconOption = props => (
    <Option {...props}>
      <div className="flex w-full items-center gap-4">
        {props.data.icon}
        {props.data.label}
      </div>
    </Option>
  );

  const setExpenseData = () => {
    if (expense) {
      const selectedCategory = expenseData?.categories?.find(
        category => expense.categoryName == category.label
      );

      const selectedVendor = expenseData?.vendors?.find(
        vendor => expense.vendorName == vendor.label
      );
      setCategory(selectedCategory);
      setVendor(selectedVendor);
    }
  };

  const handleDatePicker = date => {
    setExpenseDate(date);
    setShowDatePicker(false);
  };

  const handleCategory = async category => {
    category.label = (
      <div className="flex w-full items-center gap-4">
        {category.icon}
        {category.label}
      </div>
    );
    if (expenseData.categories.includes(category)) {
      setCategory(category);
    } else {
      const payload = {
        expense_category: {
          name: category.value,
        },
      };

      const res = await expensesApi.createCategory(payload);
      const expenses = await expensesApi.index();

      if (res.status == 200 && expenses.status == 200) {
        const newCategoryValue = expenses.data.categories.find(
          val => val.name == category.value
        );

        newCategoryValue.value = newCategoryValue.name;
        newCategoryValue.label = newCategoryValue.name;
        delete newCategoryValue.name;

        setNewCategory(newCategoryValue);
      }
    }
  };

  const handleFileUpload = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setReceipt(selectedFile);
    }
  };

  const handleSubmit = () => {
    const payload = {
      amount,
      date: expenseDate,
      description,
      expense_type: expenseType,
      expense_category_id: category?.id || newCategory?.id,
      vendor_id: vendor.id,
      receipts: receipt,
    };
    handleFormAction(payload);
  };

  const ReceiptCard = () => (
    <div
      className="my-2 flex w-full items-center justify-between rounded bg-miru-gray-100 p-3"
      key={receipt.name}
    >
      <div className="rounded bg-miru-han-purple-100 p-3">
        <FilePdfIcon
          className="text-miru-han-purple-400"
          size={16}
          weight="bold"
        />
      </div>
      <div className="ml-4 mr-2 flex w-full flex-col items-start truncate">
        <span className="text-sm font-medium">{receipt.name}</span>
        <div className="flex items-center text-xs font-medium text-miru-dark-purple-400">
          <span>PDF</span>
          <div className="mx-2 h-1 w-1 rounded-xl bg-miru-dark-purple-200" />
          <span>{Math.ceil(receipt.size / 1024)}kb</span>
        </div>
      </div>
      <Button style="ternary" onClick={() => setReceipt(null)}>
        <XIcon size={16} />
      </Button>
    </div>
  );

  const UploadCard = () => (
    <div
      className="mt-2 flex cursor-pointer items-center justify-center rounded border border-dashed border-miru-dark-purple-200 p-4"
      onClick={handleFileUpload}
    >
      <FileIcon className="text-miru-dark-purple-200" size={16} weight="bold" />
      <span className="text-center text-base font-bold text-miru-dark-purple-200">
        Upload file
      </span>
      <input
        accept="application/pdf"
        className="hidden cursor-pointer"
        ref={fileRef}
        type="file"
        onChange={handleFileSelection}
      />
    </div>
  );

  useOutsideClick(wrapperCalendarRef, () => {
    setShowDatePicker(false);
  });

  useEffect(() => {
    setExpenseData();
  }, []);

  return (
    <div className="my-6 flex flex-1 flex-col justify-between px-4 lg:px-0 ">
      <div>
        <div ref={wrapperCalendarRef}>
          <div
            className="field relative flex w-full flex-col"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <CustomInputText
              readOnly
              id="transactionDate"
              inputBoxClassName="cursor-pointer"
              label="Transaction Date"
              name="transactionDate"
              type="text"
              value={expenseDate && dayjs(expenseDate).format(dateFormat)}
              onChange={() => {}} //eslint-disable-line
            />
            <CalendarIcon
              className="absolute top-0 bottom-0 right-1 mx-2 my-3 cursor-pointer"
              color="#5B34EA"
              size={20}
            />
          </div>
          {showDatePicker && (
            <CustomDatePicker
              date={expenseDate || dayjs()}
              handleChange={handleDatePicker}
            />
          )}
        </div>
        <div className="mt-6">
          <CustomReactSelect
            handleOnChange={vendor => setVendor(vendor)}
            id="vendor"
            label="Vendor"
            name="vendor"
            options={expenseData.vendors}
            value={vendor}
          />
          <ErrorSpan message="" />
        </div>
        <div className="mt-6">
          <CustomInputText
            id="amount"
            label="Amount"
            name="amount"
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <ErrorSpan message="" />
        </div>
        <div className="mt-6">
          <CustomCreatableSelect
            components={{ Option: IconOption }}
            handleOnChange={handleCategory}
            id="category"
            label="Category"
            name="category"
            options={expenseData.categories}
            value={category || newCategory}
          />
        </div>
        <div className="mt-6">
          <CustomTextareaAutosize
            id="description"
            label="Description (optional)"
            maxRows={12}
            name="description"
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-6 flex flex-col">
          <span className="text-base font-medium text-miru-dark-purple-400">
            Expense Type (optional)
          </span>
          <div className="flex">
            <CustomRadioButton
              classNameLabel="font-medium text-sm text-miru-dark-purple-1000"
              classNameRadioIcon="lg:w-4 lg:h-4 lg:border-2 lg:mr-0"
              classNameWrapper="pt-3 mr-4"
              defaultCheck={expenseType == "personal"}
              groupName="expenseType"
              id="Personal"
              key="Personal"
              label="Personal"
              value={expenseType}
              handleOnChange={() => {
                setExpenseType("personal");
              }}
            />
            <CustomRadioButton
              classNameLabel="font-medium text-sm text-miru-dark-purple-1000"
              classNameRadioIcon="lg:w-4 lg:h-4 lg:border-2 lg:mr-0"
              classNameWrapper="pt-3"
              defaultCheck={expenseType == "business"}
              groupName="expenseType"
              id="Business"
              key="Business"
              label="Business"
              value={expenseType}
              handleOnChange={() => {
                setExpenseType("business");
              }}
            />
          </div>
        </div>
        <div className="mt-6">
          <span className="text-base font-medium text-miru-dark-purple-400">
            Receipt (optional)
          </span>
          {receipt ? <ReceiptCard /> : <UploadCard />}
        </div>
      </div>
      <div>
        {expense ? (
          <Button
            className="mt-6 w-full text-base font-bold"
            disabled={isFormActionDisabled}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        ) : (
          <Button
            className="mt-6 w-full text-base font-bold"
            disabled={isFormActionDisabled}
            onClick={handleSubmit}
          >
            Add Expense
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm;
