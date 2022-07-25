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

const EditEntry: React.FC<Iprops> = ({
  fetchEntries,
  setNewEntryView,
  selectedDateInfo,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId,
  handleDeleteEntry,
  editEntryColor
}) => {
  const { useState, useEffect } = React;
  const [note, setNote] = useState("");
  const [startDuration, setStartDuration] = useState("00:00");
  const [endDuration, setEndDuration] = useState("00:00");
  const [space, setSpace] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purposeName, setPurposeName] = useState("");
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
      setPurposeName(entry.purpose_name);
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
    <div aria-hidden="true" className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full">
      <div className="relative w-full max-w-md h-full md:h-auto float-right">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
            onClick={() => {
              setNewEntryView(false);
              setEditEntryId(0);
            }}>
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div className="w-full" style={{ backgroundColor: editEntryColor }}>
            <p className="px-6 text-xl font-medium text-gray-900 dark:text-white">
              {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${selectedDateInfo["month"]}, ${selectedDateInfo["year"]}`}
            </p>
            <p className="px-6 text-sm font-medium text-gray-900 dark:text-white">
              {startDuration} ~ {endDuration} • {purposeName}
            </p>
          </div>
          <div className="py-6 px-6 lg:px-8">
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Space</label>
                <select
                  onChange={e => {
                    setSpace(e.target.value);
                  }}
                  value={space || ""}
                  name="space"
                  id="space"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                >
                  {!space && (
                    <option disabled className="text-miru-gray-100" value="">
                              Please select space
                    </option>
                  )}
                  {[{ id: "1", name: "Conference Room" },
                    { id: "2", name: "HR Cabin" },
                    { id: "3", name: "Sales Cabin" }].map((a) => (
                    <option key={`space-${a.id}`} value={a.id}>{a["name"]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Purpose</label>
                <select
                  onChange={e => {
                    setPurpose(e.target.value);
                  }}
                  value={purpose || ""}
                  name="purpose"
                  id="purpose"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
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
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Notes</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={5}
                  cols={60}
                  name="notes"
                  placeholder=" Notes"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                ></textarea>
              </div>
              <div className="mb-2 flex justify-between">
                <div className="p-1 h-8 text-sm flex justify-center items-center">From</div>
                <select
                  className="w-30 border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                  value={startDuration}
                  onChange={(e) => setStartDuration(e.target.value)}>
                  {calendarTimes().map(e => <option value={e.id} key={e.id} >{e.name}</option>)}
                </select>
                <div className="p-1 h-8 text-sm flex justify-center items-center">To</div>
                <select
                  className="w-30 border border-gray-300 dark:border-gray-700 p-1 shadow-sm rounded text-sm focus:outline-none focus:border-blue-700 bg-transparent placeholder-gray-500 text-gray-600 dark:text-gray-400"
                  value={endDuration}
                  onChange={(e) => setEndDuration(e.target.value)}>
                  {calendarTimes().map(e => <option value={e.id} key={e.id} >{e.name}</option>)}
                </select>
              </div>
              <div className="flex justify-between">
                <a
                  onClick={() => {
                    handleDeleteEntry(editEntryId);
                    setNewEntryView(false);
                    setEditEntryId(0);
                  }}
                  className="cursor-pointer text-sm text-blue-700 hover:underline dark:text-blue-500">
                    Delete Event?
                </a>
              </div>
              <button
                onClick={() => handleEdit()}
                className={
                  "mb-1 h-8 w-full text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
                      (space && note
                        ? "bg-miru-han-purple-1000 hover:border-transparent"
                        : "bg-miru-gray-1000")
                }
              >
                UPDATE
              </button>
              <button
                onClick={() => {
                  setNewEntryView(false);
                  setEditEntryId(0);
                }}
                className="mt-1 h-8 w-full text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Iprops {
  fetchEntries: (from: string, to: string) => Promise<any>
  setNewEntryView: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDateInfo: object;
  setEntryList: React.Dispatch<React.SetStateAction<object[]>>;
  entryList: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  dayInfo: object;
  handleDeleteEntry: (id: number) => void;
  editEntryColor: string;
}

export default EditEntry;
