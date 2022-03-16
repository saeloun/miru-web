/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";
import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";
import timesheetEntryApi from "../../apis/timesheet-entry";
const { useState, useEffect, useRef } = React;
const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

interface Props {
  clients: object;
  projects: object;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: number;
  clientName: string;
  projectName: string;
  entries: [];
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  dayInfo: [];
}

const WeeklyEntryCard: React.FC<Props> = ({
  clients,
  projects,
  newRowView,
  setNewRowView,
  projectId,
  clientName,
  projectName,
  entries,
  setEntryList,
  dayInfo
}) => {
  const [selectedInputBox, setSelectedInputBox] = useState(-1);
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState(-1);
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("00:00");
  const [projectSelected, setProjectSelected] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState(0);
  const [billable, setBillable] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  const [currentEntries, setCurrentEntries] = useState([]);
  const durationInputBox = useRef("00:00");

  const handleEditProject: React.ChangeEventHandler<HTMLSelectElement> = e => {
    setProject(e.target.value);
    setProjectSelected(true);
  };

  const calculateTotalWeeklyDuration = () => {
    setWeeklyTotalHours(
      currentEntries.reduce((acc, cv) => (cv ? cv["duration"] + acc : 0), 0)
    );
  };

  const setProjectId = () => {
    setCurrentProjectId(projects[client].find(p => p.name === project).id);
  };

  const handleSetData = () => {
    if (projectId) {
      setCurrentProjectId(projectId);
      setProject(projectName);
      setClient(clientName);
      setProjectSelected(true);
      calculateTotalWeeklyDuration();
      setCurrentEntries(entries);
    }
  };

  const handleSaveEntry = async () => {
    if (!dataChanged && note && duration) return;
    const payload = {
      project_id: currentProjectId,
      duration: minutesFromHHMM(duration),
      work_date: dayInfo[selectedInputBox]["fullDate"],
      bill_status: billable ? "unbilled" : "non_billable",
      note: note
    };

    let res;
    if (currentEntries[selectedInputBox]) {
      const timesheetEntryId = currentEntries[selectedInputBox]["id"];
      res = await timesheetEntryApi.update(timesheetEntryId, payload);
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState = { ...prevState };
          newState[res.data.entry.work_date] = newState[
            res.data.entry.work_date
          ].map(entry =>
            entry.id === res.data.entry.id ? res.data.entry : entry
          );
          return newState;
        });
      }
    } else {
      res = await timesheetEntryApi.create(payload);
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState = { ...prevState };
          newState[res.data.entry.work_date] = [
            ...newState[res.data.entry.work_date],
            res.data.entry
          ];
          return newState;
        });
      }
    }

    if (res.status === 200) {
      setCurrentEntries(prevState => {
        const newState = [...prevState];
        newState[selectedInputBox] = res.data.entry;
        return newState;
      });
      setDataChanged(false);
    }

    if (newRowView) {
      setNewRowView(false);
    }
  };

  const handleCancelButton = () => {
    () => {
      if (newRowView) setNewRowView(false);
      if (!newRowView) {
        setProjectSelected(true);
        setClient(clientName);
        setProject(projectName);
      }
    };
  };

  const handleEditEntries = async () => {
    const ids = currentEntries.map(entry => entry["id"]);
    const res = await timesheetEntryApi.updateBulk({
      project_id: currentProjectId,
      ids: ids
    });
    // eslint-disable-next-line no-empty
    if (res.status === 200) {
      setEntryList(prevState => {
        const newState = { ...prevState, ...res.data.entries };
        return newState;
      });
    }
  };

  const handleDeleEntries = async () => {
    const ids = currentEntries.map(entry => entry["id"]);
    const res = await timesheetEntryApi.destroyBulk(ids);
    if (res.status === 200) {
      setEntryList(prevState => {
        const newState = { ...prevState };
        dayInfo.forEach(day => {
          newState[day["fullDate"]] = newState[day["fullDate"]]?.filter(
            entry => !ids.includes(entry["id"])
          );
        });
        return newState;
      });
    }
  };

  useEffect(() => {
    handleSetData();
  }, []);

  useEffect(() => {
    calculateTotalWeeklyDuration();
  }, [currentEntries]);

  // useEffect(() => {
  //   durationInputBox.current.focus();
  // }, [selectedInputBox]);

  return projectSelected ? (
    <div className="p-6 w-full mt-4 shadow-xl rounded-lg">
      <div className="flex items-center">
        <div className="flex mr-10 w-44">
          <p className="text-lg">{client}</p>
          <p className="text-lg mx-2">•</p>
          <p className="text-lg">{project}</p>
        </div>
        <div className="w-138 flex justify-between items-center mr-7">
          {[0, 1, 2, 3, 4, 5, 6].map((num: number) =>
            num === selectedInputBox ? (
              <input
                key={num}
                value={duration}
                onChange={e => {
                  setDataChanged(true);
                  setDuration(e.target.value);
                }}
                // ref={durationInputBox}
                className=" focus:outline-none focus:border-miru-han-purple-400 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
              />
            ) : (
              <div
                key={num}
                onClick={() => {
                  if (dataChanged) return;
                  setSelectedInputBox(num);
                  setShowNote(true);
                  setNote(
                    currentEntries[num] ? currentEntries[num]["note"] : ""
                  );
                  setDuration(
                    minutesToHHMM(
                      currentEntries[num] ? currentEntries[num]["duration"] : 0
                    )
                  );
                  currentEntries[num] &&
                  ["unbilled", "billed"].includes(
                    currentEntries[num]["bill_status"]
                  )
                    ? setBillable(true)
                    : setBillable(false);
                }}
                className="bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
              >
                {currentEntries[num]
                  ? minutesToHHMM(currentEntries[num]["duration"])
                  : "00:00"}
              </div>
            )
          )}
        </div>
        <div className="text-xl font-bold">
          {minutesToHHMM(weeklyTotalHours)}
        </div>
        <div className="flex justify-around">
          <img
            onClick={() => setProjectSelected(false)}
            src="/edit.svg"
            alt="edit"
            className="ml-8"
          />
          <img
            onClick={handleDeleEntries}
            src="/delete.svg"
            alt="delete"
            className="ml-8"
          />
        </div>
      </div>
      {showNote && (
        <div className="mt-4 mx-54 justify-between bg-miru-gray-100 w-138 rounded">
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
                className={
                  "m-2 mb-1 inline-block h-6 w-30 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
                  // eslint-disable-next-line no-constant-condition
                  (dataChanged && note && duration
                    ? "bg-miru-han-purple-1000 hover:border-transparent"
                    : "bg-miru-gray-1000")
                }
                onClick={handleSaveEntry}
              >
                SAVE
              </button>
              <button
                onClick={() => {
                  setNote("");
                  setShowNote(false);
                  setDataChanged(false);
                  setSelectedInputBox(-1);
                  setBillable(false);
                }}
                className="m-2 inline-block h-6 w-30 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex justify-between p-4 rounded-md shadow-2xl content-center">
      <select
        onChange={e => {
          setClient(e.target.value);
          setProject(projects[e.target.value][0].name);
        }}
        value={client || "Client"}
        name="client"
        id="client"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        {!client && (
          <option disabled selected className="text-miru-gray-100">
            Client
          </option>
        )}
        {clients["map"]((c, i) => (
          <option key={i.toString()}>{c.name}</option>
        ))}
      </select>
      <select
        onChange={e => {
          setProject(e.target.value);
          setProjectId();
        }}
        value={project}
        name="project"
        id="project"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        {!project && (
          <option disabled selected className="text-miru-gray-100">
            Project
          </option>
        )}
        {client &&
          projects[client].map((p, i) => (
            <option data-project-id={p.id} key={i.toString()}>
              {p.name}
            </option>
          ))}
      </select>

      <button
        onClick={() => {
          setProjectSelected(true);
          setProjectId();
          if (!newRowView) handleEditEntries();
        }}
        className={
          "h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
          (client && project
            ? "bg-miru-han-purple-1000 hover:border-transparent"
            : "bg-miru-gray-1000")
        }
      >
        SAVE
      </button>
      <button
        onClick={handleCancelButton}
        className="h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
      >
        CANCEL
      </button>
    </div>
  );
};
export default WeeklyEntryCard;
