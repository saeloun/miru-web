import React, { useState } from "react";

import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  currency,
  item,
  setSelectedOption,
  selectedOption
}) => {
  const [isEdit, setEdit] = useState<boolean>(false);

  const handleDelete = (item) => {
    const selectedOptionArr = selectedOption.filter((option) => {
      if ((item.id && option.id != item.id) ||
        (option.timesheet_entry_id && option.timesheet_entry_id != item.timesheet_entry_id)) {
        return option;
      }
    });
    setEdit(false);
    setSelectedOption(selectedOptionArr);
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
