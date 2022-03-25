/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
import timesheetEntryApi from "../../apis/timesheet-entry";
import { minutesFromHHMM, minutesToHHMM } from "../../helpers/hhmm-parser";
import { getNumberWithOrdinal } from "../../helpers/ordinal";
const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

const AddEntry: React.FC<Iprops> = ({
  setNewEntryView,
  clients,
  projects,
  selectedDateInfo,
  setEntryList,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId
}) => {
  const { useState, useEffect } = React;
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("00:00");
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [projectId, setProjectId] = useState(0);
  const [billable, setBillable] = useState(false);

  const handleFillData = () => {
    if (!editEntryId) return;
    const entry = entryList[selectedFullDate].find(
      entry => entry.id === editEntryId
    );
    if (entry) {
      setNote(entry.note);
      setDuration(minutesToHHMM(entry.duration));
      setClient(entry.client);
      setProject(entry.project);
      setProjectId(entry.project_id);
      if (["unbilled", "billed"].includes(entry.bill_status)) setBillable(true);
    }
  };

  useEffect(() => {
    handleFillData();
  }, []);

  useEffect(() => {
    if (!project) return;
    const id = projects[client].find(
      currentProject => currentProject.name === project
    ).id;
    setProjectId(Number(id));
  }, [project]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(e.target.value);
  };

  const handleSave = async () => {
    if (!note && !project) return;

    const res = await timesheetEntryApi.create({
      project_id: projectId,
      timesheet_entry: {
        work_date: selectedFullDate,
        duration: minutesFromHHMM(duration),
        note: note,
        bill_status: billable ? "unbilled" : "non_billable"
      }
    });

    if (res.status === 200) {
      setEntryList(pv => {
        const newState = { ...pv };
        if (pv[selectedFullDate]) {
          newState[selectedFullDate] = [
            res.data.entry,
            ...pv[selectedFullDate]
          ];
        } else {
          newState[selectedFullDate] = [res.data.entry];
        }
        return newState;
      });
    }
  };

  const handleEdit = async () => {
    const res = await timesheetEntryApi.update(editEntryId, {
      project_id: projectId,
      timesheet_entry: {
        bill_status: billable ? "unbilled" : "non_billable",
        note: note,
        duration: minutesFromHHMM(duration),
        work_date: selectedFullDate
      }
    });
    if (res.status === 200) {
      setEntryList(pv => {
        const newState = { ...pv };
        newState[selectedFullDate] = pv[selectedFullDate].map(entry => {
          if (entry.id === editEntryId) {
            return res.data.entry;
          }
          return entry;
        });
        return newState;
      });
      setNewEntryView(false);
      setEditEntryId(0);
    }
  };

  return (
    <div
      className={
        "h-24 py-1 flex justify-evenly rounded-lg shadow-2xl " +
        (editEntryId === 0 ? "" : "mt-10")
      }
    >
      <div className="w-60 ml-4">
        <select
          onChange={e => {
            setClient(e.target.value);
            setProject(projects[e.target.value][0].name);
          }}
          value={client || "Client"}
          name="client"
          id="client"
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
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
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
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
      <div className="mx-10">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          cols={60}
          name="notes"
          placeholder=" Notes"
          className="p-1 w-60 h-18 rounded-sm bg-miru-gray-100 my-2 focus:miru-han-purple-1000 outline-none resize-none"
        ></textarea>
      </div>
      <div className="w-60">
        <div className="flex justify-between">
          <div className="p-1 h-8 w-29 bg-miru-gray-100 rounded-sm mt-2 mr-1 text-sm flex justify-center items-center">
            {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${
              selectedDateInfo["month"]
            }, ${selectedDateInfo["year"]}`}
          </div>
          <input
            value={duration}
            onChange={handleDurationChange}
            type="text"
            className="p-1 h-8 w-29 bg-miru-gray-100 rounded-sm mt-2 ml-1 text-sm"
          />
        </div>
        <div className="flex items-center">
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
                setBillable(true);
              }}
              className="inline"
              src={uncheckedIcon}
              alt="checkbox"
            />
          )}
          <h4>Billable</h4>
        </div>
      </div>
      <div className="mr-4 my-2 ml-14">
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
