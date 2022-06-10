import React, { useState } from "react";
import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  item,
  setSelectedOption,
  selectedOption,
  quoteDetails
}) => {
  const [isEdit, setEdit] = useState<boolean>(false);

  const handleDelete = () => {
    // const sanitized = selectedOption.filter(option =>
    //   option.timesheet_entry_id !== item.timesheet_entry_id ||
    //   option.id !== item.id
    // )
    // setSelectedOption(sanitized);
  };

  return isEdit && !["accepted", "rejected", "sent"].includes(quoteDetails.status) ? (
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
      quoteDetails={quoteDetails}
    />
  );
};

export default NewLineItemRow;
