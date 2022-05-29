import React, { useState } from "react";
import EditLineItems from "./EditLineItems";
import NewLineItemStatic from "./NewLineItemStatic";

const NewLineItemRow = ({
  item,
  setSelectedOption,
  selectedOption
}) => {
  const [isEdit, setEdit] = useState<boolean>(false);

  return isEdit ? (
    <EditLineItems
      item={item}
      setSelectedOption={setSelectedOption}
      selectedOption={selectedOption}
      setEdit={setEdit}
    />
  ) : (
    <NewLineItemStatic
      item={item}
      setEdit={setEdit}
    />
  );
}

export default NewLineItemRow;
