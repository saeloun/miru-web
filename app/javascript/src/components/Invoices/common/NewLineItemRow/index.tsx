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
    const deleteItem = {
      ...item,
      _destroy: true
    };

    const selectedOptionArr = selectedOption.map((option) => {
      if (option.id === item.id) {
        return deleteItem;
      }

      return option;
    });

    setSelectedOption(selectedOptionArr);
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
