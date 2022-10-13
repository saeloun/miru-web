/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";

import { minFromHHMM, minToHHMM, validateTimesheetEntry } from "helpers";
import Logger from "js-logger";

import timesheetEntryApi from "apis/timesheet-entry";
import Toastr from "common/Toastr";

const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");
const editIcon = require("../../../../assets/images/edit.svg");

const { useState, useEffect } = React;

const WeeklyEntriesCard = ({
  client,
  project,
  currentEntries,
  setProjectSelected,
  // handleDeleteEntries,
  currentProjectId,
  setEntryList,
  setCurrentEntries,
  newRowView,
  setNewRowView,
  dayInfo,
  isWeeklyEditing,
  setIsWeeklyEditing,
  selectedEmployeeId

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
    note: note
  });

  const handleUpdateRow = (entry) => {
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
    setNote(
      currentEntries[num] ? currentEntries[num]["note"] : ""
    );
    setDuration(
      minToHHMM(
        currentEntries[num] ? currentEntries[num]["duration"] : 0
      )
    );
    currentEntries[num] &&
      ["unbilled", "billed"].includes(
        currentEntries[num]["bill_status"]
      )
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
              res.data.entry
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
    <div className="week-card p-6 w-full mt-4 shadow-xl rounded-lg">
      <div className="flex items-center">
        <div className="flex mr-10 w-44 overflow-scroll">
          <p className="text-lg">{client}</p>
          <p className="text-lg mx-2">•</p>
          <p className="text-lg">{project}</p>
        </div>
        <div className="w-138 flex justify-between items-center mr-7">
          {[0, 1, 2, 3, 4, 5, 6].map((num: number) =>
            num === selectedInputBox ? (
              <input
                key={num}
                id="selectedInput"
                value={duration}
                onChange={e => {
                  setDataChanged(true);
                  setDuration(e.target.value);
                }}
                className=" focus:outline-none focus:border-miru-han-purple-400 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 border-miru-han-purple-400 rounded bg-miru-gray-100"
              />
            ) : (
              <div
                key={num}
                onClick={() => handleDurationClick(num)}
                className={`bold text-xl content-center px-1 py-4 w-18 h-15 border-2 border-transparent rounded bg-miru-gray-100 ${currentEntries[num] ? "text-miru-gray-500" : "text-miru-dark-purple-200"}`}
              >
                {currentEntries[num]
                  ? minToHHMM(currentEntries[num]["duration"])
                  : "00:00"}
              </div>
            )
          )}
        </div>
        <div className="text-xl font-bold">
          {minToHHMM(weeklyTotalHours)}
        </div>
        <div className="flex justify-around">
          <img
            onClick={() => {if (! isWeeklyEditing) setProjectSelected(false); setIsWeeklyEditing(true); }}
            src={editIcon}
            alt="edit"
            className="icon-hover ml-8 cursor-pointer w-4 h-4"
          />
          {/* <img
            onClick={handleDeleteEntries}
            src={deleteIcon}
            alt="delete"
            className="icon-hover ml-8 cursor-pointer w-4 h-4"
          /> */}
        </div>
      </div>
      {showNote && (
        <div className="mt-4 mx-54 justify-between bg-miru-gray-100 w-138 border border-miru-gray-1000 rounded">
          <textarea
            value={note}
            onChange={e => {
              setNote(e.target.value);
              setDataChanged(true);
              setDataChanged(true);
            }}
            placeholder="Note"
            className="rounded w-full p-2 bg-miru-gray-100 outline-none resize-none"
          ></textarea>
          <div className="h-10 w-full flex justify-between bg-miru-gray-200">
            <div className="flex items-center">
              {billable ? (
                <img
                  onClick={() => {
                    setBillable(false);
                    setDataChanged(true);
                  }}
                  className="inline"
                  src={checkedIcon}
                  alt="checkbox"
                />
              ) : (
                <img
                  onClick={() => {
                    setBillable(true);
                    setDataChanged(true);
                  }}
                  className="inline"
                  src={uncheckedIcon}
                  alt="checkbox"
                />
              )}
              <h4>Billable</h4>
            </div>
            <div>
              <button
                onClick={() => {
                  setNote("");
                  setShowNote(false);
                  setDataChanged(false);
                  setSelectedInputBox(-1);
                  setBillable(false);
                  setIsWeeklyEditing(false);
                }}
                className="m-2 inline-block h-6 w-30 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest  text-center justify-center align-middle"
              >
                CANCEL
              </button>
              {currentEntries[selectedInputBox] ?
                <button
                  className={
                    "m-2 mb-1 inline-block h-6 w-30 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
                  (dataChanged && duration
                    ? "bg-miru-han-purple-1000 hover:border-transparent"
                    : "bg-miru-gray-1000")
                  }
                  onClick={handleUpdateEntry}
                >
                UPDATE
                </button>
                :
                <button
                  className={
                    "m-2 mb-1 inline-block h-6 w-30 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
                  (dataChanged && duration
                    ? "bg-miru-han-purple-1000 hover:border-transparent"
                    : "bg-miru-gray-1000")
                  }
                  onClick={handleSaveEntry}
                >
                SAVE
                </button>}
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
  projectSelected: boolean;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  // handleDeleteEntries: () => any;
  handleEditEntries: () => any;
  dayInfo: Array<any>;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
  weeklyData: any[];
  setWeeklyData: React.Dispatch<React.SetStateAction<any[]>>;
}

export default WeeklyEntriesCard;
