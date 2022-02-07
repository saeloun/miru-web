import * as React from "react";
import timesheetEntryApi from "../../apis/timesheet-entry";
import { minutesFromHHMM, minutesToHHMM } from "../../helpers/hhmm-parser";
import { getNumberWithOrdinal } from "../../helpers/ordinal";

interface props {
  setNewEntryView: React.Dispatch<React.SetStateAction<boolean>>;
  clients: client[];
  projects: object;
  selectedDateInfo: object;
  setEntryList: React.Dispatch<React.SetStateAction<object[]>>;
  entryList: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
}

interface client {
  name: string;
}

const AddEntry: React.FC<props> = ({
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
  clients = clients.sort((a, b) => (a.name < b.name ? -1 : 1));
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("00:00");
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");

  useEffect(() => {
    if (editEntryId) {
      const entry = entryList[selectedFullDate].filter(
        entry => entry.id === editEntryId
      )[0];
      if (entry) {
        setNote(entry.note);
        setDuration(minutesToHHMM(entry.duration));
        setClient(entry.client);
        setProject(entry.project);
      }
    }
  }, []);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    let [hh, mm] = v.split(":");
    if (Number(hh) > 24) hh = "00";
    if (Number(mm) > 59) mm = "00";
    v = `${hh}:${mm}`;
    setDuration(v);
  };

  const handleSave = async () => {
    if (!note && !project) return;
    const entry = {
      work_date: selectedFullDate,
      duration: minutesFromHHMM(duration),
      note: note
    };

    const res = await timesheetEntryApi.create({
      project_name: project,
      timesheet_entry: entry
    });

    if (res.data?.success) {
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

      setNewEntryView(false);
    }
  };

  const handleEdit = async () => {
    const res = await timesheetEntryApi.update(editEntryId, {
      project_name: project,
      timesheet_entry: {
        note: note,
        duration: minutesFromHHMM(duration),
        work_date: selectedFullDate
      }
    });
    if (res.data?.success) {
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
      <span className="w-60 ml-4">
        <select
          onChange={e => {
            setClient(e.target.value);
            setProject(projects[e.target.value][0].name);
          }}
          name="client"
          id="client"
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
        >
          {!client && (
            <option disabled selected className="text-miru-gray-100">
              Client
            </option>
          )}
          {clients.map((c, i) => (
            <option key={i.toString()}>{c.name}</option>
          ))}
        </select>

        <select
          onChange={e => setProject(e.target.value)}
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
            projects[client].map((p, i) => (
              <option key={i.toString()}>{p.name}</option>
            ))}
        </select>
      </span>
      <div className="mx-10">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          cols={60}
          name="notes"
          placeholder=" Notes"
          className="w-60 h-18 rounded-sm bg-miru-gray-100 my-2"
        ></textarea>
      </div>
      <div className="w-60">
        <div className="p-1 w-60 bg-miru-gray-100 rounded-sm mt-2 h-8">
          {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${
            selectedDateInfo["month"]
          }, ${selectedDateInfo["year"]}`}
        </div>
        <input
          value={duration}
          onChange={handleDurationChange}
          type="text"
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
        />
      </div>
      <div className="mr-4 my-2 ml-14">
        {editEntryId === 0 ? (
          <button
            onClick={handleSave}
            className={
              "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold " +
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
              "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold " +
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
          className="mt-1 h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default AddEntry;
