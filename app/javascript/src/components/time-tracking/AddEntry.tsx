/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import autosize from "autosize";

import timesheetEntryApi from "apis/timesheet-entry";
import Toastr from "common/Toastr";
import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";
import { getNumberWithOrdinal } from "helpers/ordinal";
import validateTimesheetEntry from "helpers/validateTimesheetEntry";

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  projects,
  selectedDateInfo,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId
}) => {
  const { useState, useEffect } = React;
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("00:00");
  const [projectId, setProjectId] = useState(null);
  const [billable, setBillable] = useState(false);
  const [projectBillable, setProjectBillable] = useState(true);

  const handleFillData = () => {
    if (! editEntryId) return;
    const entry = entryList[selectedFullDate].find(
      entry => entry.id === editEntryId
    );
    if (entry) {
      setDuration(minutesToHHMM(entry.duration));
      setProjectId(entry.project_id);
      setNote(entry.note);
      if (["unbilled", "billed"].includes(entry.bill_status)) setBillable(true);
    }

  };

  useEffect(() => {
    handleFillData();

    const textArea = document.querySelector("textarea");
    if (!textArea) return;
    autosize(textArea);
    textArea.click();
  }, []);

  useEffect(() => {
    const project = projects.find(currentProject => currentProject.id === projectId);
    if (project) {
      setProjectBillable(project.isBillable);
      setBillable(project.isBillable);
    } else {
      setBillable(false);
      setProjectBillable(true);
    }
  }, [projectId]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(e.target.value);
  };

  const getPayload = () => ({
    work_date: selectedFullDate,
    duration: minutesFromHHMM(duration),
    note: note,
    bill_status: billable ? "unbilled" : "non_billable"
  });

  const handleSave = async () => {
    const tse = getPayload();
    const message = validateTimesheetEntry(tse);
    if (message) {
      Toastr.error(message);
      return;
    }
    const res = await timesheetEntryApi.create({
      project_id: projectId,
      timesheet_entry: tse
    }, selectedEmployeeId);

    if (res.status === 200) {
      const fetchEntriesRes = await fetchEntries(selectedFullDate, selectedFullDate);
      if (fetchEntriesRes) {
        setNewEntryView(false);
      }
    }
  };

  const handleEdit = async () => {
    const tse = getPayload();
    const message = validateTimesheetEntry(tse);
    if (message) {
      Toastr.error(message);
      return;
    }
    const res = await timesheetEntryApi.update(editEntryId, {
      project_id: projectId,
      timesheet_entry: tse
    });

    if (res.status === 200) {
      const fetchEntriesRes = await fetchEntries(selectedFullDate, selectedFullDate);
      if (fetchEntriesRes) {
        setNewEntryView(false);
        setEditEntryId(0);
      }
    }
  };

  return (
    <div
      className={
        "min-h-24 p-4 flex justify-between rounded-lg shadow-sm" +
        (editEntryId ? "mt-10" : "")
      }
    >
      <div className="w-1/2">
        <div className="mt-0">
          <div className="field">
            <div className="mt-1">
              <select
                onChange={e => {
                  setProjectId(Number(e.target.value));
                }}
                value={`${projectId}`}
                name="project"
                id="project"
                className="form__input"
              >
                <option value={null} key={"none"} className="text-miru-gray-100">
                  Select Project
                </option>
                {projects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name} ({project.clientName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="field">
            <div className="mt-1">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={5}
                cols={60}
                name="notes"
                placeholder="Notes"
                className="form__input"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      <div className="w-1/4">
        <div className="mt-0">
          <div className="field">
            <div className="mt-1 flex">
              <div className="form__input bg-miru-gray-100 justify-center items-center">
                {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${
                  selectedDateInfo["month"]
                }, ${selectedDateInfo["year"]}`}
              </div>
              <input
                value={duration}
                onChange={handleDurationChange}
                type="text"
                className="form__input ml-2"
              />
            </div>
          </div>
          <div className="field">
            <div className="mt-1 flex">
              <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                <div className="items-center mt-2">
                  <label
                    htmlFor="billable-input"
                    className="flex items-center cursor-pointer text-xl"
                  >
                    <input
                      id="billable-input"
                      type="checkbox"
                      name="billable"
                      className="form__input"
                      checked={billable}
                      disabled={!projectBillable}
                      onChange={() => {
                        if (projectBillable) setBillable(!billable)
                      }}
                    />
                    <span className="text-sm ml-1">Billable</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-min">
        {editEntryId === 0 ? (
          <button
            onClick={handleSave}
            className={
              "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
              (note && projectId
                ? "bg-miru-han-purple-1000 hover:border-transparent"
                : "bg-miru-gray-1000")
            }
          >
            SAVE
          </button>
        ) : (
          <button
            onClick={() => handleEdit()}
            className={
              "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
              (note && projectId
                ? "bg-miru-han-purple-1000 hover:border-transparent"
                : "bg-miru-gray-1000")
            }
          >
            UPDATE
          </button>
        )}
        <button
          onClick={() => {
            setNewEntryView(false);
            setEditEntryId(0);
          }}
          className="mt-1 h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

interface Iprops {
  selectedEmployeeId: number;
  fetchEntries: (from: string, to: string) => Promise<any>
  setNewEntryView: React.Dispatch<React.SetStateAction<boolean>>;
  projects: any[];
  selectedDateInfo: object;
  setEntryList: React.Dispatch<React.SetStateAction<object[]>>;
  entryList: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  dayInfo: object;
}

export default AddEntry;
