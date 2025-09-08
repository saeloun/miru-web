import React from "react";
import dayjs from "dayjs";
import EntryCard from "./EntryCard";

interface TimeEntriesDisplayProps {
  selectedFullDate: string;
  entryList: any;
  handleDeleteEntry: (id: number) => void;
  handleDuplicate: (entry: any) => void;
  setEditEntryId: (id: number) => void;
  setNewEntryView: (value: boolean) => void;
}

const TimeEntriesDisplay: React.FC<TimeEntriesDisplayProps> = ({
  selectedFullDate,
  entryList,
  handleDeleteEntry,
  handleDuplicate,
  setEditEntryId,
  setNewEntryView,
}) => {
  const isoDate = dayjs(selectedFullDate, "MM-DD-YYYY").format("YYYY-MM-DD");
  const entries = entryList[isoDate];
  const hasEntries = entries && entries.length > 0;

  if (hasEntries) {
    // Calculate total duration for the day
    const totalDuration = entries.reduce(
      (sum: number, entry: any) => sum + entry.duration,
      0
    );
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-200">
          <div>
            <h3 className="text-3xl font-bold text-slate-900">
              {dayjs(selectedFullDate).format("dddd")}
            </h3>
            <p className="text-base text-slate-600 mt-2 font-medium">
              {dayjs(selectedFullDate).format("MMMM D, YYYY")}
            </p>
          </div>
          <div className="text-right bg-gradient-to-br from-blue-50 to-white rounded-2xl px-8 py-4 border border-blue-100">
            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Day Total
            </div>
            <div className="text-4xl font-bold text-blue-600 tabular-nums">
              {totalHours}h {totalMinutes > 0 ? `${totalMinutes}m` : ""}
            </div>
            <div className="text-sm text-slate-500 mt-2 font-medium">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {entries.map((entry: any, index: number) => (
            <EntryCard
              key={entry.id || index}
              id={entry.id}
              client={entry.client}
              project={entry.project}
              note={entry.note}
              duration={entry.duration}
              bill_status={entry.bill_status}
              handleDeleteEntry={handleDeleteEntry}
              handleDuplicate={handleDuplicate}
              setEditEntryId={setEditEntryId}
              setNewEntryView={setNewEntryView}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-300">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          No time entries yet
        </h3>
        <p className="text-slate-500 mb-1">
          {dayjs(selectedFullDate).format("dddd, MMMM D, YYYY")}
        </p>
        <p className="text-sm text-slate-400 mt-4">
          Click "Add Entry" to log your first time entry for this day
        </p>
      </div>
    </div>
  );
};

export default TimeEntriesDisplay;
