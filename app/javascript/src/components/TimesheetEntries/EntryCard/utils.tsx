import { Roles } from "constants/index";

import React from "react";

import { DeleteIcon, EditIcon, CopyIcon } from "miruIcons";
import { Button, BUTTON_STYLES } from "StyledComponents";

export const canEditTimeEntry = (billStatus, role) =>
  billStatus != "billed" || role == Roles["OWNER"] || role == Roles["ADMIN"];

export const showUpdateAction = (billStatus, role, id, setEditEntryId) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <Button
        className="icon-hover border-none"
        id="editIcon"
        style={BUTTON_STYLES.secondary}
        onClick={() => setEditEntryId(id)}
      >
        <EditIcon className="text-miru-han-purple-1000" size={20} />
      </Button>
    );
  }

  return <div className="mx-10 h-4 w-4" />;
};

export const showDeleteAction = (billStatus, role, id, handleDeleteEntry) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <Button
        className="icon-hover border-none"
        id="deleteIcon"
        style={BUTTON_STYLES.secondary}
        onClick={() => handleDeleteEntry(id)}
      >
        <DeleteIcon className="text-miru-han-purple-1000" size={20} />
      </Button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};

export const showDuplicateAction = (billStatus, role, id, handleDuplicate) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <Button
        className="icon-hover border-none"
        style={BUTTON_STYLES.secondary}
        onClick={() => handleDuplicate(id)}
      >
        <CopyIcon className="text-miru-han-purple-1000" size={20} />
      </Button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};
