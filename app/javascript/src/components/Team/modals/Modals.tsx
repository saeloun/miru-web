
import React from "react";
import { useList } from "context/TeamContext";
import AddEditMember from "./AddEditMember";
import DeleteMember from "./DeleteMember";

const Modals = ({ user }) => {
  const { modal } = useList();

  switch (modal) {
    case "addEdit":
      return <AddEditMember user={user} isEdit={user?.id} />;
    case "delete":
      return <DeleteMember user={user} />;
    default:
      return null;
  }
};

export default Modals;
