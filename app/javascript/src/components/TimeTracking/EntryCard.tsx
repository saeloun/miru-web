/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { minToHHMM } from "helpers";
import { Badge } from "StyledComponents";

import { Roles } from "../../constants";

const deleteIcon = require("../../../../assets/images/delete.svg");
const editIcon = require("../../../../assets/images/edit.svg");

interface props {
  id: number;
  client: string;
  project: string;
  note: string;
  duration: number;
  handleDeleteEntry: (id: number) => void; // eslint-disable-line
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  bill_status: string;
  currentUserRole: string;
}

const canEditTimeEntry = (billStatus, role) =>
  billStatus != "billed" || role == Roles["OWNER"] || role == Roles["ADMIN"];

const showUpdateAction = (billStatus, role, id, setEditEntryId) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button className="mx-10" onClick={() => setEditEntryId(id)}>
        <img
          alt="edit"
          className="icon-hover h-4 w-4 text-miru-han-purple-600 hover:text-miru-han-purple-1000"
          src={editIcon}
        />
      </button>
    );
  }

  return <div className="mx-10 h-4 w-4" />;
};

const showDeleteAction = (billStatus, role, id, handleDeleteEntry) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button className="mr-10" onClick={() => handleDeleteEntry(id)}>
        <img
          alt="delete"
          className="icon-hover fill-blue h-4 w-4 text-miru-han-purple-1000 hover:text-miru-han-purple-1000"
          src={deleteIcon}
        />
      </button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};

const EntryCard: React.FC<props> = ({
  id,
  client,
  project,
  note,
  duration,
  handleDeleteEntry,
  setEditEntryId,
  bill_status,
  currentUserRole,
}) => (
  <div className="week-card mt-10 flex w-full items-center justify-between rounded-lg p-4 shadow-2xl">
    <div className="flex-auto">
      <div className="flex">
        <p className="text-lg">{client}</p>
        <p className="mx-2 text-lg">•</p>
        <p className="text-lg">{project}</p>
      </div>
      <p className="max-h-32 w-160 overflow-auto whitespace-pre-wrap break-words text-sm text-miru-dark-purple-400">
        {note}
      </p>
    </div>
    <div className="flex items-center">
      {bill_status === "unbilled" ? (
        <Badge
          bgColor="bg-miru-alert-yellow-400"
          className="uppercase"
          color="text-miru-alert-green-1000"
          text="unbilled"
        />
      ) : bill_status === "non_billable" ? (
        <Badge
          bgColor="bg-miru-dark-purple-100"
          className="uppercase"
          color="text-miru-dark-purple-600"
          text="non billable"
        />
      ) : (
        <Badge
          bgColor="bg-miru-alert-green-400"
          className="uppercase"
          color="text-miru-alert-green-800"
          text="billed"
        />
      )}
      <p className="ml-6 text-4xl">{minToHHMM(duration)}</p>
      {showUpdateAction(bill_status, currentUserRole, id, setEditEntryId)}
      {showDeleteAction(bill_status, currentUserRole, id, handleDeleteEntry)}
    </div>
  </div>
);

export default EntryCard;
