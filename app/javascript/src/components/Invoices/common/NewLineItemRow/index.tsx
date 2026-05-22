import React from "react";

import LineItemEditorRow from "./LineItemEditorRow";

const NewLineItemRow = ({
  clientCurrency,
  item,
  setSelectedOption,
  selectedOption,
  removeElement = false,
  dateFormat,
}) => {
  const selectionId = item => item.selection_id || item.timesheet_entry_id;

  const handleDelete = item => {
    const deleteItem = {
      ...item,
      _destroy: true,
    };

    const selectedOptionArr = selectedOption.map(option => {
      if (
        (item.id && option.id === item.id) ||
        (selectionId(item) && selectionId(option) === selectionId(item)) ||
        (option.timesheet_entry_id &&
          option.timesheet_entry_id === item.timesheet_entry_id)
      ) {
        return removeElement ? null : deleteItem;
      }

      return option;
    });

    setSelectedOption(selectedOptionArr.filter(n => n));
  };

  return (
    <LineItemEditorRow
      clientCurrency={clientCurrency}
      dateFormat={dateFormat}
      handleDelete={handleDelete}
      item={item}
      setSelectedOption={setSelectedOption}
    />
  );
};

export default NewLineItemRow;
