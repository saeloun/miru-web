import React from "react";

import { minutesToHHMM } from "helpers/hhmm-parser";

import BillTag from "./BillTag";

interface props {
  id: number;
  note: string;
  start_duration: number;
  end_duration: number;
  space_name: string;
  purpose_name: string;
  user_name: string;
  handleDeleteEntry: (id: number) => void;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
}

const EntryCard: React.FC<props> = ({
  id,
  note,
  start_duration,
  end_duration,
  space_name,
  purpose_name,
  user_name,
  handleDeleteEntry,
  setEditEntryId,
}) => (
  <div className="week-card flex justify-between items-center shadow-sm w-full p-4 mt-10 rounded-sm">
    <div className="flex-auto">
      <div className="flex">
        <p className="text-lg">{space_name}</p>
        <p className="text-lg mx-2">•</p>
        <p className="text-lg">{purpose_name}</p>
      </div>
      <p className="max-h-32 overflow-scroll text-sm text-miru-dark-purple-400 break-words whitespace-pre-wrap">
        {note}
      </p>
    </div>
    <div className="flex items-center">
      <BillTag color="miru-alert-green-400" text={user_name || "unknown"} />
      <p className="pr-1 text-4xl">{minutesToHHMM(start_duration)}</p>
      TO
      <p className="pl-1 text-4xl">{minutesToHHMM(end_duration)}</p>
      <button onClick={() => setEditEntryId(id)} className="mx-10">
        <img
          src="/edit.svg"
          alt="edit"
          className="icon-hover text-miru-han-purple-600 hover:text-miru-han-purple-1000"
        />
      </button>
      <button onClick={() => handleDeleteEntry(id)} className="mr-10">
        <img
          src="/delete.svg"
          alt="delete"
          className="icon-hover fill-blue text-miru-han-purple-1000 hover:text-miru-han-purple-1000"
        />
      </button>
    </div>
  </div>
);

export default EntryCard;
