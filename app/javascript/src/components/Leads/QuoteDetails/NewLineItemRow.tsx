import React, { useState } from "react";
import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  item,
  setSelectedOption,
  quoteId,
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
      selectedLineItemId={item.lead_line_item_id || null}
      quoteId={quoteId}
      setEdit={setEdit}
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
