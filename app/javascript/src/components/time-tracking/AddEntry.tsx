/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import autosize from "autosize";
import { getNumberWithOrdinal, minFromHHMM, minToHHMM, validateTimesheetEntry } from "helpers";

import timesheetEntryApi from "apis/timesheet-entry";
import Toastr from "common/Toastr";

const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  clients,
  projects,
  selectedDateInfo,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId
}) => {
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("00:00");
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [projectId, setProjectId] = useState(0);
  const [billable, setBillable] = useState(false);
  const [projectBillable, setProjectBillable] = useState(true);

  const handleFillData = () => {
    if (! editEntryId) return;
    const entry = entryList[selectedFullDate].find(
      entry => entry.id === editEntryId
    );
    if (entry) {
      setDuration(minToHHMM(entry.duration));
      setClient(entry.client);
      setProject(entry.project);
      setProjectId(entry.project_id);
      setNote(entry.note);
      if (["unbilled", "billed"].includes(entry.bill_status)) setBillable(true);
    }
  };

  useEffect(() => {
    const textArea = document.querySelector("textarea");
    autosize(textArea);
    handleFillData();
    textArea.click();
  }, []);

  useEffect(() => {
    if (!project) return;
    const selectedProject = projects[client].find(
      currentProject => currentProject.name === project
    );
    if (selectedProject) {
      setProjectId(Number(selectedProject.id));
      setProjectBillable(selectedProject.billable);
      (projectId != selectedProject.id) && setBillable(selectedProject.billable);
    }
  }, [project]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(e.target.value);
  };

  const getPayload = () => ({
    work_date: selectedFullDate,
    duration: minFromHHMM(duration),
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
        "min-h-24 p-4 flex justify-between rounded-lg shadow-2xl " +
        (editEntryId ? "mt-10" : "")
      }
    >
      <div className="w-1/2">
        <div className="w-129 mb-2 flex justify-between">
          <select
            onChange={e => {
              setClient(e.target.value);
              setProject(projects[e.target.value][0].name);
            }}
            value={client || "Client"}
            name="client"
            id="client"
            className="w-64 bg-miru-gray-100 rounded-sm h-8"
          >
            {!client && (
              <option disabled selected className="text-miru-gray-100">
              Client
              </option>
            )}
            {clients.map((client, i) => (
              <option key={i.toString()}>{client["name"]}</option>
            ))}
          </select>

          <select
            onChange={e => {
              setProject(e.target.value);
            }}
            value={project}
            name="project"
            id="project"
            className="w-64 bg-miru-gray-100 rounded-sm h-8"
          >
            {!project && (
              <option disabled selected className="text-miru-gray-100">
              Project
              </option>
            )}
            {client &&
            projects[client].map((project, i) => (
              <option data-project-id={project.id} key={i.toString()}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          cols={60}
          name="notes"
          placeholder=" Notes"
          className={("w-129 px-1 rounded-sm bg-miru-gray-100 focus:miru-han-purple-1000 outline-none resize-none mt-2 " + (editEntryId ? "h-32" : "h-8") )}
        ></textarea>
      </div>
      <div className="w-60">
        <div className="mb-2 flex justify-between">
          <div className="p-1 h-8 w-29 bg-miru-gray-100 rounded-sm text-sm flex justify-center items-center">
            {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${
              selectedDateInfo["month"]
            }, ${selectedDateInfo["year"]}`}
          </div>
          <input
            value={duration}
            onChange={handleDurationChange}
            type="text"
            className="p-1 h-8 w-29 bg-miru-gray-100 rounded-sm text-sm"
          />
        </div>
        <div className="flex items-center mt-2">
          {billable ? (
            <img
              onClick={() => {
                setBillable(false);
              }}
              className="inline"
              src={checkedIcon}
              alt="checkbox"
            />
          ) : (
            <img
              onClick={() => {
                if (projectBillable) setBillable(true);
              }}
              className="inline"
              src={uncheckedIcon}
              alt="checkbox"
            />
          )}
          <h4>Billable</h4>
        </div>
      </div>
      <div className="max-w-min">
        {editEntryId === 0 ? (
          <button
            onClick={handleSave}
            className={
              "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
              (note && client && project
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
              (note && client && project
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
  clients: any[];
  projects: object;
  selectedDateInfo: object;
  setEntryList: React.Dispatch<React.SetStateAction<object[]>>;
  entryList: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  dayInfo: object;
}

export default AddEntry;
