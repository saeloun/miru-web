import React from "react";

import { DeleteIcon, EditIcon, CopyIcon } from "miruIcons";

import { Roles } from "../../../constants";

export const canEditTimeEntry = (billStatus, role) =>
  billStatus != "billed" || role == Roles["OWNER"] || role == Roles["ADMIN"];

export const showUpdateAction = (billStatus, role, id, setEditEntryId) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button
        className="icon-hover"
        id="editIcon"
        onClick={() => setEditEntryId(id)}
      >
        <EditIcon className="text-miru-han-purple-1000" size={20} />
      </button>
    );
  }

  return <div className="mx-10 h-4 w-4" />;
};

export const showDeleteAction = (billStatus, role, id, handleDeleteEntry) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button
        className="icon-hover "
        id="deleteIcon"
        onClick={() => handleDeleteEntry(id)}
      >
        <DeleteIcon className="text-miru-han-purple-1000" size={20} />
      </button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};

export const showDuplicateAction = (billStatus, role, id, handleDuplicate) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button className="icon-hover " onClick={() => handleDuplicate(id)}>
        <CopyIcon className="text-miru-han-purple-1000" size={20} />
      </button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};
