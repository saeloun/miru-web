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
import { Calendar } from "lucide-react";
import { TimeInput } from "../ui/time-input";
import { Toastr } from "../ui/toastr";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card } from "../ui/card";
import { cn } from "../../lib/utils";
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
  const { isDesktop, company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";
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
    work_date: dayjs(selectedDate, dateFormat).format("YYYY-MM-DD"),
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
        setSelectedFullDate(dayjs(selectedDate).format(dateFormat));
      }
    } catch (error) {
      Toastr.error(error);
    }
  };

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format(dateFormat));
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
      <div className="flex-1 space-y-3">
        <div className="flex gap-3">
          <Select
            value={client || undefined}
            onValueChange={value => {
              setClient(value);
              setProject(projects ? projects[value][0]?.name : "");
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client, i) => (
                <SelectItem key={i} value={client["name"]}>
                  {client["name"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={project || undefined}
            onValueChange={setProject}
            disabled={!client}
          >
            <SelectTrigger
              className={cn(
                "flex-1",
                !client && "opacity-50 cursor-not-allowed"
              )}
            >
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {client &&
                projects[client] &&
                projects[client].map((project, i) => (
                  <SelectItem key={i} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          name="notes"
          placeholder="Add notes..."
          value={note}
          className={cn(
            "w-full resize-none",
            editEntryId ? "min-h-[120px]" : "min-h-[80px]"
          )}
          onChange={e => setNote(e.target.value)}
        />
      </div>
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative">
            {displayDatePicker && (
              <div className="absolute top-12 z-50" ref={datePickerRef}>
                <Card className="shadow-lg">
                  <CustomDatePicker
                    date={dayjs(selectedDate).toDate()}
                    handleChange={handleDateChangeFromDatePicker}
                  />
                </Card>
              </div>
            )}
            <Button
              variant="outline"
              className="w-[160px] justify-start text-left font-normal"
              onClick={() => setDisplayDatePicker(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {format(new Date(selectedDate), "do MMM, yyyy")}
            </Button>
          </div>
          <TimeInput
            className="h-10 w-[120px] px-3"
            initTime={duration}
            name="timeInput"
            onTimeChange={handleDurationChange}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="billable"
            checked={billable}
            disabled={!projectBillable}
            onCheckedChange={checked => setBillable(checked as boolean)}
          />
          <Label
            htmlFor="billable"
            className={cn(
              "text-sm font-medium cursor-pointer",
              !projectBillable && "text-muted-foreground cursor-not-allowed"
            )}
          >
            Billable
          </Label>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {editEntryId === 0 ? (
          <Button
            disabled={handleDisableBtn()}
            onClick={() => {
              setSubmitting(true);
              handleSave();
            }}
          >
            Save Entry
          </Button>
        ) : (
          <Button disabled={handleDisableBtn()} onClick={() => handleEdit()}>
            Update Entry
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setNewEntryView(false);
            setEditEntryId(0);
          }}
        >
          Cancel
        </Button>
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
