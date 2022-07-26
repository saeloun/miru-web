/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
import spaceUsagesApi from "apis/space-usages";
import autosize from "autosize";

import Toastr from "common/Toastr";
import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";
// import { getNumberWithOrdinal } from "helpers/ordinal";
import validateTimesheetEntry from "helpers/validateTimesheetEntry";

// const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
// const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  // selectedDateInfo,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId
}) => {
  const PURPOSES = [
    { id: "1", name: "Client / Standup" },
    { id: "2", name: "Client / All Hands" },
    { id: "3", name: "Client / Other" },
    { id: "4", name: "Internal / Standup" },
    { id: "5", name: "Internal / All Hands" },
    { id: "6", name: "Internal / Project Discussion" },
    { id: "7", name: "Internal / Other" },
    { id: "8", name: "Interview" }
  ];
  const SPACES = [
    { id: "1", name: "Conference Room", alias: "CR" },
    { id: "2", name: "HR Cabin", alias: "HRC" },
    { id: "3", name: "Sales Cabin", alias: "SC" }
  ];

  const { useState, useEffect } = React;
  const [note, setNote] = useState("");
  const [startDuration, setStartDuration] = useState("12:00");
  const [endDuration, setEndDuration] = useState("12:15");
  const [space, setSpace] = useState("");
  const [purpose, setPurpose] = useState("");

  const regex = new RegExp(':', 'g')

  // const [restricted, setRestricted] = useState(false);

  const calendarTimes = () => {
    const product = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    return product([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24], [0, 15, 30, 45]).map((k) => {
      const [i, m] = [k[0], k[1]]
      if (i>=24 && m > 0)
        return (null)

      let ii = i - 12
      ii = (i === 0 || ii === 0) ? 12 : (ii < 0) ? i : ii
      return ({
        id: `${i<10 ? 0 : '' }${i}:${m<10 ? 0 : ''}${m}`,
        name: `${ii < 10 ? 0 : '' }${ii}:${m<10 ? 0 : ''}${m} ${i < 12 || i == 24 ? 'AM' : 'PM'}`
      })
    }).filter((el) => el != null)
  }

  const handleFillData = () => {
    if (! editEntryId) return;
    const entry = entryList[selectedFullDate].find(
      entry => entry.id === editEntryId
    );
    if (entry) {
      setStartDuration(minutesToHHMM(entry.start_duration));
      setEndDuration(minutesToHHMM(entry.end_duration));
      setSpace(entry.space_code);
      setPurpose(entry.purpose_code);
      setNote(entry.note);
      // setRestricted(entry.restricted);
    }

  };

  useEffect(() => {
    const textArea = document.querySelector("textarea");
    autosize(textArea);
    handleFillData();
    textArea.click();
  }, []);

  const getPayload = () => ({
    work_date: selectedFullDate,
    start_duration: minutesFromHHMM(startDuration),
    end_duration: minutesFromHHMM(endDuration),
    space_code: space,
    purpose_code: purpose,
    note: note,
    // restricted: restricted
  });

  const handleSave = async () => {
    const tse = getPayload();
    const message = validateTimesheetEntry(tse);
    if (message) {
      Toastr.error(message);
      return;
    }
    const res = await spaceUsagesApi.create({
      space_usage: tse
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
    const res = await spaceUsagesApi.update(editEntryId, {
      space_usage: tse
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
        <div className="w-auto mb-2 flex justify-between">
          <select
            onChange={e => {
              setSpace(e.target.value);
            }}
            value={space || ""}
            name="space"
            id="space"
            className="w-64 bg-miru-gray-100 rounded-sm h-8"
          >
            {!space && (
              <option disabled className="text-miru-gray-100" value="">
              Please select space
              </option>
            )}
            {SPACES.map((a) => (
              <option key={`space-${a.id}`} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            onChange={e => {
              setPurpose(e.target.value);
            }}
            value={purpose || ""}
            name="purpose"
            id="purpose"
            className="w-64 bg-miru-gray-100 rounded-sm h-8"
          >
            {!purpose && (
              <option disabled className="text-miru-gray-100" value="">
              Please select purpose
              </option>
            )}
            {PURPOSES.map((a, _i) => (
              <option key={`purpose-${a.id}`} value={a.id}>{a["name"]}</option>
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
          className={("w-auto px-1 rounded-sm bg-miru-gray-100 focus:miru-han-purple-1000 outline-none resize-none mt-2 " + (editEntryId ? "h-32" : "h-8") )}
        ></textarea>
      </div>
      <div className="w-1/3">
        <div className="mb-2 flex justify-between">
          <div className="p-1 h-8 text-sm flex justify-center items-center">From</div>
          <select
            className="w-40 border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
            onChange={(e) => setStartDuration(e.target.value)}>
            {calendarTimes().map(e =>
              <option
                value={e.id}
                key={e.id}
                disabled={!(parseInt(e.id.replace(regex, ''), 10) < parseInt(endDuration.replace(regex, ''), 10))}
              >{e.name}</option>)}
          </select>
          <div className="p-1 h-8 text-sm flex justify-center items-center">To</div>
          <select
            className="w-40 border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
            onChange={(e) => setEndDuration(e.target.value)}>
            {calendarTimes().map(e =>
              <option
                value={e.id}
                key={e.id}
                disabled={!(parseInt(e.id.replace(regex, ''), 10) > parseInt(startDuration.replace(regex, ''), 10))}
              >{e.name}</option>)}
          </select>
        </div>
        {/* <div className="flex items-center mt-2">
          {restricted ? (
            <img
              onClick={() => {
                setRestricted(false);
              }}
              className="inline"
              src={checkedIcon}
              alt="checkbox"
            />
          ) : (
            <img
              onClick={() => {
                if (restricted) setRestricted(true);
              }}
              className="inline"
              src={uncheckedIcon}
              alt="checkbox"
            />
          )}
          <h4>Restricted</h4>
        </div> */}
      </div>
      <div className="max-w-min">
        {editEntryId === 0 ? (
          <button
            onClick={handleSave}
            className={
              "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
              (space && note
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
              (space && note
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
  selectedDateInfo: object;
  setEntryList: React.Dispatch<React.SetStateAction<object[]>>;
  entryList: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  dayInfo: object;
}

export default AddEntry;
