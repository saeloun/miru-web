import React, { useRef, useState } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import CustomRadioButton from "common/CustomRadio";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { ErrorSpan } from "common/ErrorSpan";
import dayjs from "dayjs";
import { useOutsideClick } from "helpers";
import { CalendarIcon, FileIcon, XIcon } from "miruIcons";
import { Button } from "StyledComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { i18n } from "../../../i18n";

const ExpenseForm = ({
  dateFormat,
  expenseData,
  handleFormAction,
  expense = null,
}) => {
  const wrapperCalendarRef = useRef(null);
  const fileRef = useRef(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseDate, setExpenseDate] = useState(
    expense?.date ? dayjs(expense.date) : dayjs()
  );
  const [vendor, setVendor] = useState(expense?.vendorName || "");
  const [amount, setAmount] = useState(expense?.amount || "");
  const [category, setCategory] = useState(expense?.categoryName || "");
  const [description, setDescription] = useState(expense?.description || "");
  const [expenseType, setExpenseType] = useState(
    expense?.type || expense?.expenseType || "business"
  );
  const [receipts, setReceipts] = useState(expense?.receipts || []);

  const isFormActionDisabled = !(expenseDate && amount && category);

  const handleDatePicker = date => {
    setExpenseDate(date);
    setShowDatePicker(false);
  };

  const handleFileUpload = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFileSelection = event => {
    const uploadedFiles = [...event.target.files];
    const sortedFiles = uploadedFiles.filter(
      (file, index) => file.size < 2097152 && index < 10
    );
    setReceipts(sortedFiles);
  };

  const handleSubmit = () => {
    const formData = new FormData();

    formData.append("expense[amount]", amount);
    formData.append("expense[date]", expenseDate);
    formData.append("expense[description]", description);
    formData.append("expense[expense_type]", expenseType);
    formData.append("expense[category_name]", category);
    if (vendor.trim()) formData.append("expense[vendor_name]", vendor.trim());
    receipts?.forEach(file => {
      if (file instanceof File) formData.append("expense[receipts][]", file);
    });

    handleFormAction(formData);
  };

  const removeReceipt = receipt => {
    setReceipts(receipts.filter(item => item !== receipt));
  };

  const ReceiptCard = () => (
    <div className="flex w-full flex-col">
      {receipts.map(receipt => (
        <div
          className="my-2 flex w-full items-center justify-between rounded bg-muted p-3"
          key={receipt.name || receipt}
        >
          <div className="rounded bg-accent p-3">
            <FileIcon
              className="text-muted-foreground"
              size={16}
              weight="bold"
            />
          </div>
          <div className="ml-4 mr-2 flex w-full flex-col items-start truncate">
            <span className="text-sm font-medium">
              {receipt.name || i18n.t("expenses.receipt")}
            </span>
            {receipt.size && (
              <div className="flex items-center text-xs font-medium text-muted-foreground">
                <span>{Math.ceil(receipt.size / 1024)}kb</span>
              </div>
            )}
          </div>
          <Button style="ternary" onClick={() => removeReceipt(receipt)}>
            <XIcon size={16} />
          </Button>
        </div>
      ))}
    </div>
  );

  const UploadCard = () => (
    <div
      className="mt-2 flex cursor-pointer items-center justify-center rounded border border-dashed border-border p-4"
      onClick={handleFileUpload}
    >
      <FileIcon className="text-muted-foreground" size={16} weight="bold" />
      <span className="text-center text-base font-bold text-muted-foreground">
        {i18n.t("expenses.uploadFile")}
      </span>
      <input
        multiple
        accept=".jpg,.jpeg,.xls,.xlsx,.csv,.pdf,.png; max-size:2097152"
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
              label={i18n.t("payments.transactionDate")}
              name="transactionDate"
              type="text"
              value={expenseDate && dayjs(expenseDate).format(dateFormat)}
              onChange={() => {}}
            />
            <CalendarIcon
              className="absolute top-0 bottom-0 right-1 mx-2 my-3 cursor-pointer"
              color="#5E58F1"
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
          <CustomInputText
            id="vendor"
            label={i18n.t("expenses.vendor")}
            name="vendor"
            type="text"
            value={vendor}
            onChange={e => setVendor(e.target.value)}
          />
          <ErrorSpan message="" />
        </div>
        <div className="mt-6">
          <CustomInputText
            id="amount"
            label={i18n.t("amount")}
            name="amount"
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <ErrorSpan message="" />
        </div>
        <div className="mt-6">
          <label className="text-base font-medium text-muted-foreground">
            {i18n.t("expenses.category")}
          </label>
          <div className="mt-1">
            <Select
              value={category}
              onValueChange={value => setCategory(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={i18n.t("expenses.selectCategoryEllipsis")} />
              </SelectTrigger>
              <SelectContent>
                {expenseData.categories?.map(categoryOption => (
                  <SelectItem
                    key={categoryOption.value || categoryOption.name}
                    value={categoryOption.value || categoryOption.name}
                  >
                    <div className="flex w-full items-center gap-4">
                      {categoryOption.icon}
                      {categoryOption.label || categoryOption.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6">
          <CustomTextareaAutosize
            id="description"
            label={i18n.t("expenses.descriptionOptional")}
            maxRows={12}
            name="description"
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-6 flex flex-col">
          <span className="text-base font-medium text-muted-foreground">
            {i18n.t("expenses.expenseType")}
          </span>
          <div className="flex">
            <CustomRadioButton
              classNameLabel="font-medium text-sm text-foreground"
              classNameRadioIcon="lg:w-4 lg:h-4 lg:border-2"
              classNameWrapper="pt-3 mr-4"
              defaultCheck={expenseType === "business"}
              groupName="expenseType"
              id="Business"
              key="Business"
              label={i18n.t("expenses.business")}
              value={expenseType}
              handleOnChange={() => setExpenseType("business")}
            />
            <CustomRadioButton
              classNameLabel="font-medium text-sm text-foreground"
              classNameRadioIcon="lg:w-4 lg:h-4 lg:border-2"
              classNameWrapper="pt-3"
              defaultCheck={expenseType === "personal"}
              groupName="expenseType"
              id="Personal"
              key="Personal"
              label={i18n.t("expenses.personal")}
              value={expenseType}
              handleOnChange={() => setExpenseType("personal")}
            />
          </div>
        </div>
        <div className="mt-6">
          <span className="text-base font-medium text-muted-foreground">
            {i18n.t("expenses.receiptOptional")}
          </span>
          {receipts.length > 0 ? <ReceiptCard /> : <UploadCard />}
        </div>
      </div>
      <div>
        <Button
          className="mt-6 w-full text-base font-bold"
          disabled={isFormActionDisabled}
          onClick={handleSubmit}
        >
          {expense ? i18n.t("expenses.saveChanges") : i18n.t("expenses.addExpense")}
        </Button>
      </div>
    </div>
  );
};

export default ExpenseForm;
