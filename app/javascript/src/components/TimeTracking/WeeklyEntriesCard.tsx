/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";

import { minFromHHMM, minToHHMM, validateTimesheetEntry } from "helpers";
import Logger from "js-logger";

import timesheetEntryApi from "apis/timesheet-entry";
import Toastr from "common/Toastr";

const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");
const editIcon = require("../../../../assets/images/edit.svg");

const WeeklyEntriesCard = ({
  client,
  project,
  currentEntries,
  setProjectSelected,
  currentProjectId,
  setEntryList,
  setCurrentEntries,
  newRowView,
  setNewRowView,
  dayInfo,
  isWeeklyEditing,
  setIsWeeklyEditing,
  selectedEmployeeId,
}: Iprops) => {
  const [selectedInputBox, setSelectedInputBox] = useState<number>(-1);
  const [note, setNote] = useState<string>("");
  const [duration, setDuration] = useState<string>("00:00");
  const [showNote, setShowNote] = useState<boolean>(false);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState<number>(0);
  const [billable, setBillable] = useState<boolean>(false);
  const [dataChanged, setDataChanged] = useState<boolean>(false);

  const getPayload = () => ({
    project_id: currentProjectId,
    duration: minFromHHMM(duration),
    bill_status: billable ? "unbilled" : "non_billable",
    note,
  });

  const handleUpdateRow = entry => {
    setCurrentEntries(prevState => {
      const newState: any = [...prevState];
      newState[selectedInputBox] = entry;

      return newState;
    });
  };

  const handleDurationClick = (num: number) => {
    if (dataChanged) return;

    if (isWeeklyEditing) return;
    setSelectedInputBox(num);
    setShowNote(true);
    setNote(currentEntries[num] ? currentEntries[num]["note"] : "");
    setDuration(
      minToHHMM(currentEntries[num] ? currentEntries[num]["duration"] : 0)
    );

    currentEntries[num] &&
    ["unbilled", "billed"].includes(currentEntries[num]["bill_status"])
      ? setBillable(true)
      : setBillable(false);
    setIsWeeklyEditing(true);
  };

  const handleSaveEntry = async () => {
    try {
      const payload = getPayload();
      const message = validateTimesheetEntry(payload);
      if (message) {
        Toastr.error(message);

        return;
      }
      payload["work_date"] = dayInfo[selectedInputBox]["fullDate"];
      const res = await timesheetEntryApi.create(payload, selectedEmployeeId);
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState: any = { ...prevState };
          if (newState[res.data.entry.work_date]) {
            newState[res.data.entry.work_date] = [
              ...newState[res.data.entry.work_date],
              res.data.entry,
            ];
          } else {
            newState[res.data.entry.work_date] = [res.data.entry];
          }

          return newState;
        });
        handleUpdateRow(res.data.entry);
        if (newRowView) setNewRowView(false);
        setDataChanged(false);
        setShowNote(false);
        setIsWeeklyEditing(false);
      }
    } catch (error) {
      Logger.error(error.message);
    }
  };

  const handleUpdateEntry = async () => {
    try {
      const timesheetEntryId = currentEntries[selectedInputBox]["id"];
      const payload = getPayload();
      const message = validateTimesheetEntry(payload);
      if (message) {
        Toastr.error(message);

        return;
      }
      const res = await timesheetEntryApi.update(timesheetEntryId, payload);
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState: any = { ...prevState };
          newState[res.data.entry.work_date] = newState[
            res.data.entry.work_date
          ].map(entry =>
            entry.id === res.data.entry.id ? res.data.entry : entry
          );

          return newState;
        });
        handleUpdateRow(res.data.entry);
        setDataChanged(false);
        setShowNote(false);
        setIsWeeklyEditing(false);
      }
    } catch (error) {
      Logger.error(error.message);
    }
  };

  const calculateTotalWeeklyDuration = () => {
    setWeeklyTotalHours(
      currentEntries.reduce((acc, cv) => (cv ? cv["duration"] + acc : 0), 0)
    );
  };

  const handleSetFocus = () => {
    if (selectedInputBox === -1) return;
    document.getElementById("selectedInput").focus();
  };

  useEffect(() => {
    handleSetFocus();
  }, [selectedInputBox]);

  useEffect(() => {
    calculateTotalWeeklyDuration();
  }, [currentEntries]);

  useEffect(() => {
    handleSetFocus();
  }, [selectedInputBox]);

  useEffect(() => {
    handleSetFocus();
  }, []);

  return (
    <div className="week-card mt-4 w-full rounded-lg p-6 shadow-xl">
      <div className="flex items-center">
        <div className="mr-10 flex w-44 overflow-scroll">
          <p className="text-lg">{client}</p>
          <p className="mx-2 text-lg">•</p>
          <p className="text-lg">{project}</p>
        </div>
        <div className="mr-7 flex w-138 items-center justify-between">
          {[0, 1, 2, 3, 4, 5, 6].map((num: number) =>
            num === selectedInputBox ? (
              <input
                className=" focus:outline-none bold h-15 w-18 content-center rounded border-2 border-miru-han-purple-400 bg-miru-gray-100 px-1 py-4 text-xl focus:border-miru-han-purple-400"
                id="selectedInput"
                key={num}
                value={duration}
                onChange={e => {
                  setDataChanged(true);
                  setDuration(e.target.value);
                }}
              />
            ) : (
              <div
                key={num}
                className={`bold h-15 w-18 content-center rounded border-2 border-transparent bg-miru-gray-100 px-1 py-4 text-xl ${
                  currentEntries[num]
                    ? "text-miru-gray-500"
                    : "text-miru-dark-purple-200"
                }`}
                onClick={() => handleDurationClick(num)}
              >
                {currentEntries[num]
                  ? minToHHMM(currentEntries[num]["duration"])
                  : "00:00"}
              </div>
            )
          )}
        </div>
        <div className="text-xl font-bold">{minToHHMM(weeklyTotalHours)}</div>
        <div className="flex justify-around">
          <img
            alt="edit"
            className="icon-hover ml-8 h-4 w-4 cursor-pointer"
            src={editIcon}
            onClick={() => {
              if (!isWeeklyEditing) setProjectSelected(false);
              setIsWeeklyEditing(true);
            }}
          />
        </div>
      </div>
      {showNote && (
        <div className="mx-54 mt-4 w-138 justify-between rounded border border-miru-gray-1000 bg-miru-gray-100">
          <textarea
            className="outline-none w-full resize-none rounded bg-miru-gray-100 p-2"
            placeholder="Note"
            value={note}
            onChange={e => {
              setNote(e.target.value);
              setDataChanged(true);
              setDataChanged(true);
            }}
          />
          <div className="flex h-10 w-full justify-between bg-miru-gray-200">
            <div className="flex items-center">
              {billable ? (
                <img
                  alt="checkbox"
                  className="inline"
                  src={checkedIcon}
                  onClick={() => {
                    setBillable(false);
                    setDataChanged(true);
                  }}
                />
              ) : (
                <img
                  alt="checkbox"
                  className="inline"
                  src={uncheckedIcon}
                  onClick={() => {
                    setBillable(true);
                    setDataChanged(true);
                  }}
                />
              )}
              <h4>Billable</h4>
            </div>
            <div>
              <button
                className="m-2 inline-block h-6 w-30 justify-center rounded border border-miru-han-purple-1000 bg-transparent py-1 px-6 text-center align-middle text-xs font-bold tracking-widest text-miru-han-purple-600  hover:border-transparent hover:bg-miru-han-purple-1000 hover:text-white"
                onClick={() => {
                  setNote("");
                  setShowNote(false);
                  setDataChanged(false);
                  setSelectedInputBox(-1);
                  setBillable(false);
                  setIsWeeklyEditing(false);
                }}
              >
                CANCEL
              </button>
              {currentEntries[selectedInputBox] ? (
                <button
                  className={`m-2 mb-1 inline-block h-6 w-30 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
                    dataChanged && duration
                      ? "bg-miru-han-purple-1000 hover:border-transparent"
                      : "bg-miru-gray-1000"
                  }`}
                  onClick={handleUpdateEntry}
                >
                  UPDATE
                </button>
              ) : (
                <button
                  className={`m-2 mb-1 inline-block h-6 w-30 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
                    dataChanged && duration
                      ? "bg-miru-han-purple-1000 hover:border-transparent"
                      : "bg-miru-gray-1000"
                  }`}
                  onClick={handleSaveEntry}
                >
                  SAVE
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Iprops {
  client: string;
  project: string;
  selectedEmployeeId: number;
  currentEntries: Array<any>;
  setCurrentEntries: React.Dispatch<React.SetStateAction<[]>>;
  currentProjectId: number;
  setProjectSelected: React.Dispatch<React.SetStateAction<boolean>>;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  dayInfo: Array<any>;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default WeeklyEntriesCard;
