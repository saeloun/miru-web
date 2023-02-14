import React from "react";

import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  currency,
  item,
  setSelectedOption,
  selectedOption,
  removeElement = false,
}) => {
  const handleDelete = item => {
    const deleteItem = {
      ...item,
      _destroy: true,
    };

    const selectedOptionArr = selectedOption.map(option => {
      if (
        (item.id && option.id === item.id) ||
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
    <NewLineItemStatic
      currency={currency}
      handleDelete={handleDelete}
      item={item}
      selectedOption={selectedOption}
      setSelectedOption={setSelectedOption}
    />
  );
};

export default NewLineItemRow;
