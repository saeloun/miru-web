/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
import spaceUsagesApi from "apis/space-usages";
import autosize from "autosize";

import Toastr from "common/Toastr";
import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";
import { getNumberWithOrdinal } from "helpers/ordinal";
import validateTimesheetEntry from "helpers/validateTimesheetEntry";

// const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
// const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  selectedDateInfo,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId
}) => {
  const { useState, useEffect } = React;
  const [note, setNote] = useState("");
  const [startDuration, setStartDuration] = useState("00:00");
  const [endDuration, setEndDuration] = useState("00:00");
  const [space, setSpace] = useState("");
  const [purpose, setPurpose] = useState("");
  // const [restricted, setRestricted] = useState(false);

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
        <div className="w-129 mb-2 flex justify-between">
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
            {[{ id: "1", name: "Conference Room" },
              { id: "2", name: "HR Cabin" },
              { id: "3", name: "Sales Cabin" },
              { id: "4", name: "My Place" }].map((a) => (
              <option key={`space-${a.id}`} value={a.id}>{a["name"]}</option>
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
            {[
              { id: "1", name: "Client / Standup" },
              { id: "2", name: "Client / All Hands" },
              { id: "3", name: "Client / Other" },
              { id: "4", name: "Internal / Standup" },
              { id: "5", name: "Internal / All Hands" },
              { id: "6", name: "Internal / Project Discussion" },
              { id: "7", name: "Internal / Other" },
            ].map((a, _i) => (
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
          className={("w-129 px-1 rounded-sm bg-miru-gray-100 focus:miru-han-purple-1000 outline-none resize-none mt-2 " + (editEntryId ? "h-32" : "h-8") )}
        ></textarea>
      </div>
      <div className="w-1/3">
        <div className="mb-2 flex justify-between">
          <div className="p-1 h-8 w-29 bg-miru-gray-100 rounded-sm text-sm flex justify-center items-center">
            {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${
              selectedDateInfo["month"]
            }, ${selectedDateInfo["year"]}`}
          </div>
          <div className="p-1 h-8 text-sm flex justify-center items-center">From</div>
          <input
            value={startDuration}
            onChange={(e) => setStartDuration(e.target.value)}
            type="text"
            className="p-1 h-8 w-19 bg-miru-gray-100 rounded-sm text-sm"
          />
          <div className="p-1 h-8 text-sm flex justify-center items-center">To</div>
          <input
            value={endDuration}
            onChange={(e) => setEndDuration(e.target.value)}
            type="text"
            className="p-1 h-8 w-19 bg-miru-gray-100 rounded-sm text-sm"
          />
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
