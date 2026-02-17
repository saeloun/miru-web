import { Roles, BILL_STATUS } from "constants/index";

import React from "react";

import { DeleteIcon, EditIcon, CopyIcon } from "miruIcons";
import { Button, BUTTON_STYLES } from "StyledComponents";

export const canEditTimeEntry = (billStatus, role) =>
  billStatus !== BILL_STATUS.BILLED ||
  role === Roles["OWNER"] ||
  role === Roles["ADMIN"];

export const showUpdateAction = (
  billStatus,
  role,
  id,
  setEditTimeoffEntryId
) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <Button
        className="icon-hover border-none"
        id="editIcon"
        style={BUTTON_STYLES.secondary}
        onClick={() => setEditTimeoffEntryId(id)}
      >
        <EditIcon className="text-miru-han-purple-1000" size={20} />
      </Button>
    );
  }

  return <div className="mx-10 h-4 w-4" />;
};

export const showDeleteAction = (
  billStatus,
  role,
  id,
  handleDeleteTimeoffEntry
) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <Button
        className="icon-hover border-none"
        id="deleteIcon"
        style={BUTTON_STYLES.secondary}
        onClick={() => handleDeleteTimeoffEntry(id)}
      >
        <DeleteIcon className="text-miru-han-purple-1000" size={20} />
      </Button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};

export const showDuplicateAction = (
  billStatus,
  role,
  id,
  handleDuplicateTimeoffEntry
) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <Button
        className="icon-hover border-none"
        style={BUTTON_STYLES.secondary}
        onClick={() => handleDuplicateTimeoffEntry(id)}
      >
        <CopyIcon className="text-miru-han-purple-1000" size={20} />
      </Button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};
