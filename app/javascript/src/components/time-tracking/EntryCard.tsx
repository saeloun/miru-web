import React from "react";
import BillTag from "./BillTag";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

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
    <div>
      <div className="flex">
        <p className="text-lg">{client}</p>
        <p className="text-lg mx-2">•</p>
        <p className="text-lg">{project}</p>
      </div>
      <p className="max-h-32 w-129 overflow-scroll text-sm text-miru-dark-purple-400 break-words whitespace-pre-wrap">
        {note}
      </p>
    </div>
    <div className="flex items-center">
      {bill_status === "unbilled" ? (
        <BillTag color="miru-alert-yellow-400" text="unbilled" />
      ) : bill_status === "non_billable" ? (
        <BillTag color="miru-dark-purple-100" text="non billable" />
      ) : (
        <BillTag color="miru-alert-green-400" text="billed" />
      )}
      <p className="text-4xl">{minutesToHHMM(duration)}</p>
      <button onClick={() => setEditEntryId(id)} className="mx-10 h-4 w-4">
        <img
          src="/edit.svg"
          alt="edit"
          className="icon-hover text-miru-han-purple-600 hover:text-miru-han-purple-1000"
        />
      </button>
      <button onClick={() => handleDeleteEntry(id)} className="mr-10 h-4 w-4">
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
