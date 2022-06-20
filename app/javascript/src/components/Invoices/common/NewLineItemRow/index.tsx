import React, { useState } from "react";
import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  item,
  setSelectedOption,
  selectedOption,
  removeElement = false
}) => {
  const [isEdit, setEdit] = useState<boolean>(false);

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
    />
  ) : (
    <NewLineItemStatic
      handleDelete={handleDelete}
      item={item}
      setEdit={setEdit}
    />
  );
};

export default NewLineItemRow;
