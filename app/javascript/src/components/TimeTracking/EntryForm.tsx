 
import React, { useState, useEffect, useRef, MutableRefObject } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import CustomDatePicker from "common/CustomDatePicker";
import { useUserContext } from "context/UserContext";
import { format } from "date-fns";
import dayjs from "dayjs";
import {
  minFromHHMM,
  minToHHMM,
  useDebounce,
  useOutsideClick,
  validateTimesheetEntry,
} from "helpers";
import { CheckedCheckboxSVG, UncheckedCheckboxSVG } from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";
import { TimeInput, Toastr } from "StyledComponents";
import { getValueFromLocalStorage, setToLocalStorage } from "utils/storage";

import MobileEntryForm from "./MobileView/MobileEntryForm";

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
  handleAddEntryDateChange,
  handleFilterEntry,
  handleRelocateEntry,
  setSelectedFullDate,
  setUpdateView,
  handleDeleteEntry,
  fetchEntriesofMonth,
  removeLocalStorageItems,
}) => {
  const initialNote = getValueFromLocalStorage("note") || "";
  const initialDuration = getValueFromLocalStorage("duration") || "";
  const initialClient = getValueFromLocalStorage("client") || "";
  const initialProject = getValueFromLocalStorage("project") || "";
  const initialProjectId = parseInt(
    getValueFromLocalStorage("projectId") || "0"
  );
  const initialBillable = getValueFromLocalStorage("billable") === "true";
  const initialProjectBillable =
    getValueFromLocalStorage("projectBillable") === "true";

  const [note, setNote] = useState<string>(initialNote);
  const [duration, setDuration] = useState<string>(initialDuration);
  const [client, setClient] = useState<string>(initialClient);
  const [project, setProject] = useState<string>(initialProject);
  const [projectId, setProjectId] = useState<number>(initialProjectId);
  const [billable, setBillable] = useState<boolean>(initialBillable);
  const [projectBillable, setProjectBillable] = useState<boolean>(
    initialProjectBillable
  );
  const [selectedDate, setSelectedDate] = useState<string>(selectedFullDate);
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const datePickerRef: MutableRefObject<any> = useRef();
  const { isDesktop } = useUserContext();
  const isNewEntry = !editEntryId;
  const debouncedNote = useDebounce(note, 500);
  useOutsideClick(datePickerRef, () => {
    setDisplayDatePicker(false);
  });

  useEffect(() => {
    setSelectedDate(selectedFullDate);
  }, [selectedFullDate]);

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
    if (!project) {
      return setProjectId(0);
    }

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
  }, [project, client]);

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
    removeLocalStorageItems();
    const tse = getPayload();
    const res = await timesheetEntryApi.create(
      {
        project_id: projectId,
        timesheet_entry: tse,
      },
      selectedEmployeeId
    );

    if (res.status === 200) {
      const fetchEntriesRes = await fetchEntries(selectedDate, selectedDate);
      if (!isDesktop) {
        fetchEntriesofMonth();
      }

      if (fetchEntriesRes) {
        setNewEntryView(false);
        setUpdateView(true);
        handleAddEntryDateChange(dayjs(selectedDate));
      }
    }
  };

  const handleEdit = async () => {
    try {
      const tse = getPayload();
      const updateRes = await timesheetEntryApi.update(editEntryId, {
        project_id: projectId,
        timesheet_entry: tse,
      });

      if (updateRes.status >= 200 && updateRes.status < 300) {
        if (selectedDate !== selectedFullDate) {
          await handleFilterEntry(selectedFullDate, editEntryId);
          await handleRelocateEntry(selectedDate, updateRes.data.entry);
          if (!isDesktop) {
            fetchEntriesofMonth();
          }
        } else {
          await fetchEntries(selectedDate, selectedDate);
          fetchEntriesofMonth();
        }
        setEditEntryId(0);
        setNewEntryView(false);
        setUpdateView(true);
        handleAddEntryDateChange(dayjs(selectedDate));
        setSelectedFullDate(dayjs(selectedDate).format("YYYY-MM-DD"));
      }
    } catch (error) {
      Toastr.error(error);
    }
  };

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
    setDisplayDatePicker(false);
    setUpdateView(false);
  };

  const handleDisableBtn = () => {
    const tse = getPayload();
    const message = validateTimesheetEntry(tse, client, projectId);
    if (message || submitting) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    handleFillData();
  }, []);

  const setLocalStorageItems = () => {
    setToLocalStorage("note", debouncedNote);
    setToLocalStorage("duration", duration);
    setToLocalStorage("client", client);
    setToLocalStorage("project", project);
    setToLocalStorage("projectId", projectId.toString());
    setToLocalStorage("billable", billable.toString());
    setToLocalStorage("projectBillable", projectBillable.toString());
  };

  useEffect(() => {
    if (isNewEntry) {
      setLocalStorageItems();
    }
  }, [
    debouncedNote,
    duration,
    client,
    project,
    projectId,
    billable,
    projectBillable,
  ]);

  return isDesktop ? (
    <div
      className={`
       hidden min-h-24 justify-between rounded-lg p-4 shadow-2xl lg:flex ${
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
              setProject(projects ? projects[e.target.value][0]?.name : "");
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
          className={`
            focus:miru-han-purple-1000 outline-none mt-2 w-129 resize-none overflow-y-auto rounded-sm bg-miru-gray-100 px-1 ${
              editEntryId ? "h-auto" : "h-8"
            }
          `}
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
              id="formattedDate"
              onClick={() => {
                setDisplayDatePicker(true);
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
              id="check"
              src={CheckedCheckboxSVG}
              onClick={() => {
                setBillable(false);
              }}
            />
          ) : (
            <img
              alt="checkbox"
              className="inline"
              id="uncheck"
              src={UncheckedCheckboxSVG}
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
            disabled={handleDisableBtn()}
            className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
              handleDisableBtn()
                ? "cursor-not-allowed bg-miru-gray-1000"
                : "bg-miru-han-purple-1000 hover:border-transparent"
            }`}
            onClick={() => {
              setSubmitting(true);
              handleSave();
            }}
          >
            SAVE
          </button>
        ) : (
          <button
            disabled={handleDisableBtn()}
            className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
              handleDisableBtn()
                ? "cursor-not-allowed bg-miru-gray-1000"
                : "bg-miru-han-purple-1000 hover:border-transparent"
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
  ) : (
    <MobileEntryForm
      billable={billable}
      client={client}
      clients={clients}
      duration={duration}
      editEntryId={editEntryId}
      handleDeleteEntry={handleDeleteEntry}
      handleEdit={handleEdit}
      handleSave={handleSave}
      note={note}
      project={project}
      projects={projects}
      selectedDate={selectedDate}
      setBillable={setBillable}
      setClient={setClient}
      setDuration={setDuration}
      setEditEntryId={setEditEntryId}
      setNewEntryView={setNewEntryView}
      setNote={setNote}
      setProject={setProject}
      setSelectedDate={setSelectedDate}
      setSubmitting={setSubmitting}
      submitting={submitting}
    />
  );
};

interface Iprops {
  selectedEmployeeId: number;
  fetchEntries: (from: string, to: string) => Promise<any>;  
  fetchEntriesofMonth: any;
  setNewEntryView: React.Dispatch<React.SetStateAction<boolean>>;
  clients: any[];
  projects: object;
  selectedFullDate: string;
  editEntryId: number;
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  entryList: object;
  handleAddEntryDateChange: any;
  handleFilterEntry: (date: string, entryId: string | number) => object;  
  handleRelocateEntry: (date: string, entry: object) => void;  
  setSelectedFullDate: any;
  setUpdateView: any;
  handleDeleteEntry: any;
  removeLocalStorageItems: () => void;
}

export default AddEntry;
