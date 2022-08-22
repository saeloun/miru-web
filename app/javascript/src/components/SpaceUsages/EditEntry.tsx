/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
import spaceUsagesApi from "apis/space-usages";
import autosize from "autosize";

import ConfirmDialog from "common/Modal/ConfirmDialog";
import Toastr from "common/Toastr";
import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";
import { getNumberWithOrdinal } from "helpers/ordinal";
import validateTimesheetEntry from "helpers/validateTimesheetEntry";
import { Multiselect } from 'multiselect-react-dropdown';

// const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
// const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

const EditEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  selectedDateInfo,
  entryList,
  selectedFullDate,
  setEditEntryId,
  editEntryId,
  handleDeleteEntry,
  editEntryColor,
  setSelectedSpaceId,
  selectedSpaceId,
  setNewEntryId,
  setSelectedTime,
  selectedTime,
  setSelectedStartTime,
  setSelectedEndTime,
  isPastDate,
  allMemberList,
}) => {
  const PURPOSES = [
    { id: "1", name: "Client / Standup" },
    { id: "2", name: "Client / All Hands" },
    { id: "3", name: "Client / Other" },
    { id: "4", name: "Internal / Standup" },
    { id: "5", name: "Internal / All Hands" },
    { id: "6", name: "Internal / Project Discussion" },
    { id: "7", name: "Internal / Other" },
    { id: "8", name: "Interview" },
  ];
  const SPACES = [
    { id: "1", name: "Conference Room", alias: "CR" },
    { id: "2", name: "HR Cabin", alias: "HRC" },
    { id: "3", name: "Sales Cabin", alias: "SC" }
  ];
  const { useState, useEffect } = React;
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const currentTime: string = minutesToHHMM(minutesFromHHMM(`${new Date().getHours()}:${new Date().getMinutes()}`) - (minutesFromHHMM(`${new Date().getHours()}:${new Date().getMinutes()}`) % 15));
  const [startDuration, setStartDuration] = useState(selectedTime || currentTime);
  const [endDuration, setEndDuration] = useState("00:00");
  const [displayStartDuration, setDisplayStartDuration] = useState("");
  const [displayEndDuration, setDisplayEndDuration] = useState("");
  const [space, setSpace] = useState(selectedSpaceId ? selectedSpaceId.toString() : "");
  const [purpose, setPurpose] = useState("");
  const [purposeName, setPurposeName] = useState("");
  const [userName, setUserName] = useState("");
  // const [restricted, setRestricted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any>([]);
  const [teamMembers, setTeamMembers] = useState<any>([]);

  const addRemoveStack = (selectedList: any) => {
    setSelectedTeamMembers(selectedList);
    setTeamMembers(selectedList.map((i: any) => parseInt(i.id)));
  };

  const calendarTimes = (durationFrom) => {
    durationFrom = durationFrom || "00:00"
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
    }).filter((el) => (el != null && minutesFromHHMM(el.id) >= minutesFromHHMM(durationFrom)) )
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
      setUserName(entry.user_name);
      setTeamMembers(entry.team_members);
      const selectedMembers = allMemberList.filter((member: any) => entry.team_members.map(Number).includes(parseInt(member.id)));
      setSelectedTeamMembers(selectedMembers);
      // setRestricted(entry.restricted);
    }

  };

  useEffect(() => {
    const textArea = document.querySelector("textarea");
    autosize(textArea);
    handleFillData();
    textArea.click();
  }, []);

  useEffect(() => {
    if (startDuration){
      setDisplayStartDuration(calendarTimes(startDuration)[0].name)
      setSelectedTime(undefined)
      setSelectedStartTime(minutesFromHHMM(startDuration))
    }
    if (endDuration){
      setDisplayEndDuration(calendarTimes(endDuration)[0].name)
      setSelectedEndTime(minutesFromHHMM(endDuration))
    }
  }, [startDuration, endDuration]);

  const getPayload = () => ({
    work_date: selectedFullDate,
    start_duration: minutesFromHHMM(startDuration),
    end_duration: minutesFromHHMM(endDuration),
    space_code: space,
    purpose_code: purpose,
    note: note,
    team_members: teamMembers,
    // restricted: restricted
  });

  const handleSave = async () => {
    setIsProcessing(true);
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
        setSelectedSpaceId(undefined);
        setSelectedStartTime(undefined);
        setSelectedEndTime(undefined);
        setNewEntryId(res.data.entry.id);
        setIsProcessing(false);
      }
    }
  };

  const handleEdit = async () => {
    setIsProcessing(true);
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
        setSelectedSpaceId(undefined);
        setSelectedStartTime(undefined);
        setSelectedEndTime(undefined);
        setIsProcessing(false);
      }
    }
  };
  const loadingButton = <>
    <svg
      className="inline-block w-5 h-5 mr-3 animate-spin"
      version="1.1"
      id="Capa_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 583.162 583.162" xmlSpace="preserve">
      <g>
        <g>
          <polygon points="279.958,255.742 279.958,116.211 163.722,116.211 0.993,255.742 0.993,278.965 256.711,278.965 		"/>
          <polygon points="256.711,304.197 117.228,304.197 117.228,420.409 256.711,583.162 279.958,583.162 279.958,327.42 		"/>
          <polygon points="326.936,278.989 466.418,278.989 466.418,162.754 326.936,0 303.689,0 303.689,255.742 		"/>
          <polygon points="303.205,327.42 303.205,466.927 419.44,466.927 582.169,327.42 582.169,304.197 326.427,304.197 		"/>
        </g>
      </g>
    </svg>
    Processing...
  </>;

  const handleDelete = () => {
    handleDeleteEntry(editEntryId);
    setNewEntryView(false);
    setEditEntryId(0);
    setSelectedSpaceId(undefined);
    setSelectedStartTime(undefined);
    setSelectedEndTime(undefined);
  };

  return (
    <div aria-hidden="true" className="fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
      <div className="relative float-right w-full h-full max-w-md md:h-auto">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
            onClick={() => {
              setNewEntryView(false);
              setEditEntryId(0);
              setSelectedSpaceId(undefined);
              setSelectedStartTime(undefined);
              setSelectedEndTime(undefined);
            }}>
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
          </button>
          {editEntryId === 0 ? (<div className="w-full p-6" style={{ backgroundColor: "#335CD6" }}>
            <p className="px-6 text-xl font-medium text-white dark:text-white">
              {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${selectedDateInfo["month"]}, ${selectedDateInfo["year"]}`}
            </p>
            <p className="px-6 text-sm font-medium text-white dark:text-white">
              Occupy new space for you
            </p>
          </div>) : (
            <div className="w-full p-6" style={{ backgroundColor: editEntryColor }}>
              <p className="px-6 text-xl font-medium text-gray-900 dark:text-white">
                {`${getNumberWithOrdinal(selectedDateInfo["date"])} ${selectedDateInfo["month"]}, ${selectedDateInfo["year"]}`}
              </p>
              <p className="px-6 text-sm font-medium text-gray-900 dark:text-white">
                {displayStartDuration} ~ {displayEndDuration} • {purposeName}, By <b>{userName}</b>
              </p>
            </div>
          )}
          <div className="px-6 py-6 lg:px-8">
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300 required">Space</label>
                <select
                  disabled={isPastDate}
                  onChange={e => {
                    setSpace(e.target.value);
                    setSelectedSpaceId(parseInt(e.target.value));
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
                  {SPACES.map((a) => (
                    <option key={`space-${a.id}`} value={a.id}>{a["name"]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300 required">Purpose</label>
                <select
                  disabled={isPastDate}
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
                  {PURPOSES.map((a, _i) => (
                    <option key={`purpose-${a.id}`} value={a.id}>{a["name"]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Members Joining</label>
                <Multiselect
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  selectedValues={selectedTeamMembers}
                  options={allMemberList ? allMemberList : [{}]}
                  name="team_member_ids"
                  onSelect={((selectedList) => addRemoveStack(selectedList))}
                  onRemove={((selectedList) => addRemoveStack(selectedList))}
                  displayValue="name"
                  disable={isPastDate} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300 required">Notes</label>
                <textarea
                  disabled={isPastDate}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={5}
                  cols={60}
                  name="notes"
                  placeholder=" Notes"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                ></textarea>
              </div>
              <div className="flex justify-between mb-2">
                <label className="flex items-center justify-center h-8 p-1 text-sm required">From</label>
                <select
                  disabled={isPastDate}
                  className="p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-300 rounded shadow-sm w-30 dark:border-gray-700 focus:outline-none focus:border-blue-700 dark:text-gray-400"
                  value={startDuration}
                  onChange={(e) => {
                    setStartDuration(e.target.value)
                    const addNextMinutes = minutesFromHHMM(e.target.value) >= 1440 ? 0 : 15
                    setEndDuration((minutesToHHMM(minutesFromHHMM(e.target.value) + addNextMinutes)))
                  }}>
                  {calendarTimes(null).map(e => <option value={e.id} key={e.id} >{e.name}</option>)}
                </select>
                <label className="flex items-center justify-center h-8 p-1 text-sm required">To</label>
                <select
                  disabled={isPastDate}
                  className="p-1 text-sm text-gray-600 placeholder-gray-500 bg-transparent border border-gray-300 rounded shadow-sm w-30 dark:border-gray-700 focus:outline-none focus:border-blue-700 dark:text-gray-400"
                  value={endDuration}
                  onChange={(e) => setEndDuration(e.target.value)}>
                  {calendarTimes(startDuration).map(e => <option value={e.id} key={e.id} >{e.name}</option>)}
                </select>
              </div>
              {editEntryId === 0 ? (
                <button
                  onClick={handleSave}
                  disabled={!(space && purpose && note) || isProcessing}
                  className={
                    `mb-1 h-8 w-full text-xs py-1 px-6 rounded border text-white font-bold tracking-widest bg-miru-han-purple-1000 hover:border-transparent ${!isProcessing ? 'disabled:bg-miru-gray-1000' : 'disabled:bg-miru-han-purple-400'}`
                  }
                >
                  {isProcessing ? loadingButton : 'SAVE'}
                </button>
              ) : !isPastDate &&
                (
                  <>
                    <div className="flex justify-between">
                      <a
                        onClick={() => {
                          setConfirmOpen(true);
                        }}
                        className="text-sm text-blue-700 cursor-pointer hover:underline dark:text-blue-500">
                          Delete Event?
                      </a>
                      <ConfirmDialog
                        title="Delete Space Slot?"
                        open={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={handleDelete}
                      >
                        Are you sure you want to delete this Space Slot?
                      </ConfirmDialog>
                    </div>
                    <button
                      onClick={handleEdit}
                      disabled={!(space && purpose && note) || isProcessing}
                      className={
                        `mb-1 h-8 w-full text-xs py-1 px-6 rounded border text-white font-bold tracking-widest bg-miru-han-purple-1000 hover:border-transparent ${!isProcessing ? 'disabled:bg-miru-gray-1000' : 'disabled:bg-miru-han-purple-400'}`
                      }
                    >
                      {isProcessing ? loadingButton : 'UPDATE'}
                    </button>
                  </>
                )}
              <button
                onClick={() => {
                  setNewEntryView(false);
                  setEditEntryId(0);
                  setSelectedSpaceId(undefined);
                  setSelectedStartTime(undefined);
                  setSelectedEndTime(undefined);
                }}
                className="w-full h-8 px-6 py-1 mt-1 text-xs font-bold tracking-widest bg-transparent border rounded border-miru-han-purple-1000 hover:bg-miru-han-purple-1000 text-miru-han-purple-600 hover:text-white hover:border-transparent"
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
  handleDeleteEntry: (id: number) => void;
  editEntryColor: string;
  setSelectedSpaceId: React.Dispatch<React.SetStateAction<number>>;
  selectedSpaceId?: 1 | 2 | 3;
  setNewEntryId: React.Dispatch<React.SetStateAction<number>>;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  selectedTime?: string;
  setSelectedStartTime: React.Dispatch<React.SetStateAction<number>>;
  setSelectedEndTime: React.Dispatch<React.SetStateAction<number>>;
  isPastDate: boolean;
  allMemberList: any;
}

export default EditEntry;
