import React from "react";

import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  currency,
  item,
  setSelectedOption,
  selectedOption,
  removeElement = false,
  isEdit,
  setEdit
}) => {

  const handleDelete = (item) => {
    const deleteItem = {
      ...item,
      _destroy: true
    };

    const selectedOptionArr = selectedOption.map((option) => {
      if ((item.id && option.id === item.id) ||
        (option.timesheet_entry_id && option.timesheet_entry_id === item.timesheet_entry_id)) {
        return removeElement ? null : deleteItem;
      }
      return option;
    });

    setEdit(false);
    setSelectedOption(selectedOptionArr.filter(n => n));
  };

  return isEdit ? (
    <EditLineItems
      item={item}
      setSelectedOption={setSelectedOption}
      selectedOption={selectedOption}
      handleDelete={handleDelete}
      setEdit={setEdit}
    />
  ) : (
    <NewLineItemStatic
      currency={currency}
      handleDelete={handleDelete}
      item={item}
      setEdit={setEdit}
    />
  );
};

export default NewLineItemRow;
