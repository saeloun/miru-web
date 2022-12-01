import React, { useState } from "react";

import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  currency,
  item,
  setSelectedOption,
  selectedOption,
  removeElement = false,
}) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);

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

    setIsEdit(false);
    setSelectedOption(selectedOptionArr.filter(n => n));
  };

  return isEdit ? (
    <EditLineItems
      handleDelete={handleDelete}
      item={item}
      selectedOption={selectedOption}
      setIsEdit={setIsEdit}
      setSelectedOption={setSelectedOption}
    />
  ) : (
    <NewLineItemStatic
      currency={currency}
      handleDelete={handleDelete}
      item={item}
      setIsEdit={setIsEdit}
    />
  );
};

export default NewLineItemRow;
