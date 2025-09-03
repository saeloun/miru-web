import React, { useState, useEffect } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import {
  minFromHHMM,
  minToHHMM,
  useDebounce,
  validateTimesheetEntry,
} from "helpers";
import { TimeInput } from "../ui/time-input";
import { Toastr } from "../ui/toastr";
import { Textarea } from "../ui/textarea";
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
  const [taskType, setTaskType] = useState<string>(
    getValueFromLocalStorage("taskType") || "development"
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { isDesktop, company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";
  const isNewEntry = !editEntryId;
  const debouncedNote = useDebounce(note, 500);

  const handleFillData = () => {
    if (!editEntryId) return;
    const isoDate = dayjs(selectedFullDate, dateFormat).format("YYYY-MM-DD");
    const entries = entryList[isoDate];
    if (!entries) return;
    const entry = entries.find(entry => entry.id === editEntryId);
    if (entry) {
      setDuration(minToHHMM(entry.duration));
      setClient(entry.client);
      setProject(entry.project);
      setProjectId(entry.project_id);
      setNote(entry.note);
      // Set task type from entry if available
      setTaskType(entry.task_type || "development");
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
    }
  }, [project, client]);

  const handleDurationChange = val => {
    setDuration(val);
  };

  const getPayload = () => ({
    work_date: dayjs(selectedFullDate, dateFormat).format("YYYY-MM-DD"),
    duration: minFromHHMM(duration),
    note,
    task_type: taskType,
    bill_status: "non_billable",
  });

  const handleSave = async () => {
    // Save the current selections before clearing for next time
    const savedClient = client;
    const savedProject = project;
    const savedProjectId = projectId;
    const savedTaskType = taskType;
    
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
      // After successful save, store the last used values for next time
      setToLocalStorage("client", savedClient);
      setToLocalStorage("project", savedProject);
      setToLocalStorage("projectId", savedProjectId.toString());
      setToLocalStorage("taskType", savedTaskType);
      // Clear only the note and duration for new entry
      setToLocalStorage("note", "");
      setToLocalStorage("duration", "");
      
      const fetchEntriesRes = await fetchEntries(
        selectedFullDate,
        selectedFullDate
      );
      if (!isDesktop) {
        fetchEntriesofMonth();
      }

      if (fetchEntriesRes) {
        setNewEntryView(false);
        setUpdateView(true);
        handleAddEntryDateChange(dayjs(selectedFullDate));
      }
    }
  };

  const handleEdit = async () => {
    try {
      setSubmitting(true);
      const tse = getPayload();
      const updateRes = await timesheetEntryApi.update(editEntryId, {
        project_id: projectId,
        timesheet_entry: tse,
      });

      if (updateRes.status >= 200 && updateRes.status < 300) {
        await fetchEntries(selectedFullDate, selectedFullDate);
        if (!isDesktop) {
          fetchEntriesofMonth();
        }
        setEditEntryId(0);
        setNewEntryView(false);
        setUpdateView(true);
        handleAddEntryDateChange(dayjs(selectedFullDate));
      }
    } catch (error) {
      Toastr.error(error);
    } finally {
      setSubmitting(false);
    }
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
    setToLocalStorage("taskType", taskType);
  };

  useEffect(() => {
    if (isNewEntry) {
      setLocalStorageItems();
    }
  }, [debouncedNote, duration, client, project, projectId, taskType]);

  return isDesktop ? (
    <Card className="w-full shadow-sm border border-border bg-card backdrop-blur-sm rounded-lg">
      <div className={`p-8 ${editEntryId ? "mt-4" : ""}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client and Project Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="client"
                  className="text-sm font-semibold text-foreground"
                >
                  Client
                </Label>
                <Select
                  value={client}
                  onValueChange={value => {
                    setClient(value);
                    setProject(projects ? projects[value][0]?.name : "");
                  }}
                >
                  <SelectTrigger className="h-12">
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
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="project"
                  className="text-sm font-semibold text-foreground"
                >
                  Project
                </Label>
                <Select
                  value={project}
                  onValueChange={setProject}
                  disabled={!client}
                >
                  <SelectTrigger
                    className={cn(
                      "h-12",
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
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-sm font-semibold text-foreground"
              >
                Description
              </Label>
              <Textarea
                name="notes"
                placeholder="What did you work on? Add your notes here..."
                value={note}
                className={cn(
                  "w-full resize-none min-h-[120px] text-base",
                  editEntryId ? "min-h-[140px]" : "min-h-[120px]"
                )}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column - Time, Task Type, and Actions */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="duration"
                  className="text-sm font-semibold text-foreground"
                >
                  Time Spent
                </Label>
                <TimeInput
                  className="h-12 w-full px-4 text-base font-mono"
                  initTime={duration}
                  name="timeInput"
                  onTimeChange={handleDurationChange}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="taskType"
                  className="text-sm font-semibold text-foreground"
                >
                  Task Type
                </Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="review">Code Review</SelectItem>
                    <SelectItem value="debugging">Debugging</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {editEntryId === 0 ? (
                <Button
                  size="lg"
                  disabled={handleDisableBtn()}
                  onClick={() => {
                    setSubmitting(true);
                    handleSave();
                  }}
                  className="h-12 text-base font-semibold"
                >
                  Save Entry
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={handleDisableBtn()}
                  onClick={() => {
                    handleEdit();
                  }}
                  className="h-12 text-base font-semibold"
                >
                  Update Entry
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setNewEntryView(false);
                  setEditEntryId(0);
                }}
                className="h-12 text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  ) : (
    <MobileEntryForm
      taskType={taskType}
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
      selectedDate={selectedFullDate}
      setTaskType={setTaskType}
      setClient={setClient}
      setDuration={setDuration}
      setEditEntryId={setEditEntryId}
      setNewEntryView={setNewEntryView}
      setNote={setNote}
      setProject={setProject}
      setSelectedDate={setSelectedFullDate}
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
