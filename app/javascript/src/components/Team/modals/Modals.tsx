
import React from "react";
import { useList } from "context/TeamContext";
import AddEditMember from "./AddEditMember";
import DeleteMember from "./DeleteMember";

const Modals = () => {
  const { modal } = useList();

  switch (modal) {
    case "addEdit":
      return <AddEditMember />;
    case "delete":
      return <DeleteMember />;
    default:
      return <></>;
  }
};

export default Modals;
