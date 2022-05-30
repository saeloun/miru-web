import React, { useState } from "react";
import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  item,
  setSelectedOption,
  selectedOption
}) => {
  const [isEdit, setEdit] = useState<boolean>(false);
  const handleDelete = (item) => {
    const sanitized = selectedOption.filter(option =>
      option.timesheet_entry_id !== item.timesheet_entry_id
    )
    setSelectedOption(sanitized);
  }
  console.log("item ===> ", item);
  return isEdit ? (
    <EditLineItems
      item={item}
      setSelectedOption={setSelectedOption}
      selectedOption={selectedOption}
      setEdit={setEdit}
    />
  ) : (
    <NewLineItemStatic
      handleDelete={handleDelete}
      item={item}
      setEdit={setEdit}
    />
  );
}

export default NewLineItemRow;
