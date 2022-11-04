/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect, useRef, MutableRefObject } from "react";

import autosize from "autosize";
import { format } from "date-fns";
import dayjs from "dayjs";
import { minFromHHMM, minToHHMM, validateTimesheetEntry } from "helpers";
import { useOutsideClick } from "helpers";

import timesheetEntryApi from "apis/timesheet-entry";
import CustomDatePicker from "common/CustomDatePicker";
import Toastr from "common/Toastr";

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  projects,
  entryList,
  selectedFullDate,
  editEntryId,
  setEditEntryId,
  handleFilterEntry,
  handleRelocateEntry
}) => {
  const [note, setNote] = useState<string>("");
  const [duration, setDuration] = useState<string>("00:00");
  const [projectId, setProjectId] = useState<number>(0);
  const [billable, setBillable] = useState<boolean>(false);
  const [projectBillable, setProjectBillable] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(selectedFullDate);
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);

  const datePickerRef: MutableRefObject<any>  = useRef();

  useOutsideClick(datePickerRef, () => { setDisplayDatePicker(false); } );

  const handleFillData = () => {
    if (! editEntryId) return;
    const entry = entryList[selectedFullDate].find(
      entry => entry.id === editEntryId
    );
    if (entry) {
      setDuration(minToHHMM(entry.duration));
      setProjectId(entry.project_id);
      setNote(entry.note);
      if (["unbilled", "billed"].includes(entry.bill_status)) {
        setBillable(true);
      }
    }
  };

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
    work_date: selectedDate,
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
    try {
      const tse = getPayload();
      const message = validateTimesheetEntry(tse);
      if (message) {
        Toastr.error(message);
        return;
      }

      const updateRes = await timesheetEntryApi.update(editEntryId, {
        project_id: projectId,
        timesheet_entry: tse
      });

      if (updateRes.status >= 200 && updateRes.status < 300) {
        if (selectedDate  !== selectedFullDate) {
          await handleFilterEntry(selectedFullDate, editEntryId);
          await handleRelocateEntry(selectedDate, updateRes.data.entry);
        } else {
          await fetchEntries(selectedFullDate, selectedFullDate);
        }
        setEditEntryId(0);
        setNewEntryView(false);
      }
    } catch (error) {
      Toastr.error(error);
    }
  };

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
    setDisplayDatePicker(false);
  };

  useEffect(() => {
    const textArea = document.querySelector("textarea");
    autosize(textArea);
    handleFillData();
    textArea.click();
  }, []);

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
              <div>
                { displayDatePicker &&
                <div className="relative" ref={datePickerRef}>
                  <div className="absolute h-100 w-100 z-10 top-8">
                    <CustomDatePicker
                      handleChange={handleDateChangeFromDatePicker}
                      date={dayjs(selectedDate).toDate()}
                    />
                  </div>
                </div>
                }
                <div className="formatted-date p-1 h-8 w-29 bg-miru-gray-100 rounded-sm text-sm flex justify-center items-center" onClick={() => { if (editEntryId) setDisplayDatePicker(true);} }>
                  {format(new Date(selectedDate), "do MMM, yyyy")}
                </div>
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
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  dayInfo: object;
  entryList: object;
  handleFilterEntry: (date: string, entryId: (string | number)) => object;
  handleRelocateEntry: (date: string, entry: object) => void;
}

export default AddEntry;
