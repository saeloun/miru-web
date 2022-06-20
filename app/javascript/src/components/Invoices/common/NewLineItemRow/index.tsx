import React, { useState } from "react";
import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  item,
  setSelectedOption,
  selectedOption
}) => {
  const [isEdit, setEdit] = useState<boolean>(false);

  const handleDelete = () => {
    // const sanitized = selectedOption.filter(option =>
    //   option.timesheet_entry_id !== item.timesheet_entry_id ||
    //   option.id !== item.id
    // )
    // setSelectedOption(sanitized);
  };

  return isEdit ? (
    <EditLineItems
      item={item}
      setSelectedOption={setSelectedOption}
      selectedOption={selectedOption}
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
