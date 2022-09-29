/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { minToHHMM } from "helpers";

import { Badge } from "../../styledComponents";

const deleteIcon = require("../../../../assets/images/delete.svg");
const editIcon = require("../../../../assets/images/edit.svg");

interface props {
  id: number;
  client: string;
  project: string;
  note: string;
  duration: number;
  handleDeleteEntry: (id: number) => void;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  bill_status: string;
}

const EntryCard: React.FC<props> = ({
  id,
  client,
  project,
  note,
  duration,
  handleDeleteEntry,
  setEditEntryId,
  bill_status
}) => (
  <div className="week-card flex justify-between items-center shadow-2xl w-full p-4 mt-10 rounded-lg">
    <div className="flex-auto">
      <div className="flex">
        <p className="text-lg">{client}</p>
        <p className="text-lg mx-2">•</p>
        <p className="text-lg">{project}</p>
      </div>
      <p className="max-h-32 w-160 overflow-auto text-sm text-miru-dark-purple-400 break-words whitespace-pre-wrap">
        {note}
      </p>
    </div>
    <div className="flex items-center">
      {bill_status === "unbilled" ? (
        <Badge
          text="unbilled"
          color="text-miru-alert-green-1000"
          bgColor="bg-miru-alert-yellow-400"
          className="uppercase"
        />
      ) : bill_status === "non_billable" ? (
        <Badge
          text="non billable"
          color="text-miru-dark-purple-600"
          bgColor="bg-miru-dark-purple-100"
          className="uppercase"
        />
      ) : (
        <Badge
          text="billed"
          color="text-miru-alert-green-800"
          bgColor="bg-miru-alert-green-400"
          className="uppercase"
        />
      )}
      <p className="text-4xl">{minToHHMM(duration)}</p>
      <button onClick={() => setEditEntryId(id)} className="mx-10">
        <img
          src={editIcon}
          alt="edit"
          className="icon-hover text-miru-han-purple-600 hover:text-miru-han-purple-1000 w-4 h-4"
        />
      </button>
      <button onClick={() => handleDeleteEntry(id)} className="mr-10">
        <img
          src={deleteIcon}
          alt="delete"
          className="icon-hover fill-blue text-miru-han-purple-1000 hover:text-miru-han-purple-1000 w-4 h-4"
        />
      </button>
    </div>
  </div>
);

export default EntryCard;
