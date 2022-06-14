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

  const handleDelete = (item) => {

    const sanitizedSelected = selectedOption.filter(option =>
      option.id !== item.id
    );
    const newItem = {
      ...item,
      _destroy: true
    };
    setSelectedOption([...sanitizedSelected, { ...newItem }]);
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
