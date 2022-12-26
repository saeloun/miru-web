/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect, useRef, MutableRefObject } from "react";

import { format } from "date-fns";
import dayjs from "dayjs";
import {
  minFromHHMM,
  minToHHMM,
  useOutsideClick,
  validateTimesheetEntry,
} from "helpers";
import TextareaAutosize from "react-autosize-textarea";
import { TimeInput } from "StyledComponents";

import timesheetEntryApi from "apis/timesheet-entry";
import CustomDatePicker from "common/CustomDatePicker";
import Toastr from "common/Toastr";

const checkedIcon = require("../../../../assets/images/checkbox-checked.svg");
const uncheckedIcon = require("../../../../assets/images/checkbox-unchecked.svg");

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
  fetchEntries,
  setNewEntryView,
  clients,
  projects,
  entryList,
  selectedFullDate,
  editEntryId,
  setEditEntryId,
  handleFilterEntry,
  handleRelocateEntry,
}) => {
  const [note, setNote] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [client, setClient] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [projectId, setProjectId] = useState<number>(0);
  const [billable, setBillable] = useState<boolean>(false);
  const [projectBillable, setProjectBillable] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(selectedFullDate);
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);

  const datePickerRef: MutableRefObject<any> = useRef();

  useOutsideClick(datePickerRef, () => {
    setDisplayDatePicker(false);
  });

  const handleFillData = () => {
    if (!editEntryId) return;
    const entry = entryList[selectedFullDate].find(
      entry => entry.id === editEntryId
    );
    if (entry) {
      setDuration(minToHHMM(entry.duration));
      setClient(entry.client);
      setProject(entry.project);
      setProjectId(entry.project_id);
      setNote(entry.note);
      if (["unbilled", "billed"].includes(entry.bill_status)) {
        setBillable(true);
      }
    }
  };

  useEffect(() => {
    if (!project) return;
    const selectedProject = projects[client].find(
      currentProject => currentProject.name === project
    );
    if (selectedProject) {
      setProjectId(Number(selectedProject.id));
      setProjectBillable(selectedProject.billable);
      if (projectId != selectedProject.id) {
        setBillable(selectedProject.billable);
      }
    }
  }, [project]);

  const handleDurationChange = val => {
    setDuration(val);
  };

  const getPayload = () => ({
    work_date: selectedDate,
    duration: minFromHHMM(duration),
    note,
    bill_status: billable ? "unbilled" : "non_billable",
  });

  const handleSave = async () => {
    const tse = getPayload();
    const message = validateTimesheetEntry(tse);
    if (message) {
      Toastr.error(message);

      return;
    }

    const res = await timesheetEntryApi.create(
      {
        project_id: projectId,
        timesheet_entry: tse,
      },
      selectedEmployeeId
    );

    if (res.status === 200) {
      const fetchEntriesRes = await fetchEntries(
        selectedFullDate,
        selectedFullDate
      );
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
        timesheet_entry: tse,
      });

      if (updateRes.status >= 200 && updateRes.status < 300) {
        if (selectedDate !== selectedFullDate) {
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
    handleFillData();
  }, []);

  return (
    <div
      className={`min-h-24 flex justify-between rounded-lg p-4 shadow-2xl ${
        editEntryId ? "mt-10" : ""
      }`}
    >
      <div className="w-1/2">
        <div className="mb-2 flex w-129 justify-between">
          <select
            className="h-8 w-64 rounded-sm bg-miru-gray-100"
            id="client"
            name="client"
            value={client || "Client"}
            onChange={e => {
              setClient(e.target.value);
              setProject(projects[e.target.value][0].name);
            }}
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
            className="h-8 w-64 rounded-sm bg-miru-gray-100"
            id="project"
            name="project"
            value={project}
            onChange={e => {
              setProject(e.target.value);
            }}
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
        <TextareaAutosize
          cols={60}
          name="notes"
          placeholder=" Notes"
          rows={5}
          value={note}
          className={`focus:miru-han-purple-1000 outline-none mt-2 w-129 resize-none overflow-y-auto rounded-sm bg-miru-gray-100 px-1 ${
            editEntryId ? "h-auto" : "h-8"
          }`}
          onChange={e => setNote(e.target["value"])}
        />
      </div>
      <div className="w-60">
        <div className="mb-2 flex justify-between">
          <div>
            {displayDatePicker && (
              <div className="relative" ref={datePickerRef}>
                <div className="h-100 w-100 absolute top-8 z-10">
                  <CustomDatePicker
                    date={dayjs(selectedDate).toDate()}
                    handleChange={handleDateChangeFromDatePicker}
                  />
                </div>
              </div>
            )}
            <div
              className="formatted-date flex h-8 w-29 items-center justify-center rounded-sm bg-miru-gray-100 p-1 text-sm"
              onClick={() => {
                if (editEntryId) setDisplayDatePicker(true);
              }}
            >
              {format(new Date(selectedDate), "do MMM, yyyy")}
            </div>
          </div>
          <TimeInput
            className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm placeholder:text-miru-gray-1000"
            initTime={duration}
            name="timeInput"
            onTimeChange={handleDurationChange}
          />
        </div>
        <div className="mt-2 flex items-center">
          {billable ? (
            <img
              alt="checkbox"
              className="inline"
              src={checkedIcon}
              onClick={() => {
                setBillable(false);
              }}
            />
          ) : (
            <img
              alt="checkbox"
              className="inline"
              src={uncheckedIcon}
              onClick={() => {
                if (projectBillable) setBillable(true);
              }}
            />
          )}
          <h4>Billable</h4>
        </div>
      </div>
      <div className="max-w-min">
        {editEntryId === 0 ? (
          <button
            className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
              note && client && project
                ? "bg-miru-han-purple-1000 hover:border-transparent"
                : "bg-miru-gray-1000"
            }`}
            onClick={handleSave}
          >
            SAVE
          </button>
        ) : (
          <button
            className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
              note && client && project
                ? "bg-miru-han-purple-1000 hover:border-transparent"
                : "bg-miru-gray-1000"
            }`}
            onClick={() => handleEdit()}
          >
            UPDATE
          </button>
        )}
        <button
          className="mt-1 h-8 w-38 rounded border border-miru-han-purple-1000 bg-transparent py-1 px-6 text-xs font-bold tracking-widest text-miru-han-purple-600 hover:border-transparent hover:bg-miru-han-purple-1000 hover:text-white"
          onClick={() => {
            setNewEntryView(false);
            setEditEntryId(0);
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

interface Iprops {
  selectedEmployeeId: number;
  fetchEntries: (from: string, to: string) => Promise<any>; // eslint-disable-line
  setNewEntryView: React.Dispatch<React.SetStateAction<boolean>>;
  clients: any[];
  projects: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  entryList: object;
  handleFilterEntry: (date: string, entryId: string | number) => object; // eslint-disable-line
  handleRelocateEntry: (date: string, entry: object) => void; // eslint-disable-line
}

export default AddEntry;
