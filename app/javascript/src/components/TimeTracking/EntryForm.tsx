import React, { useState, useEffect } from "react";

import { timesheetEntryApi } from "apis/api";
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
import { Star, StarHalf } from "phosphor-react";

import MobileEntryForm from "./MobileView/MobileEntryForm";
import { i18n } from "../../i18n";

const AddEntry: React.FC<Iprops> = ({
  selectedEmployeeId,
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
  refreshVisibleEntries,
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
  const [projectBillable, setProjectBillable] = useState<boolean>(false);

  const { isDesktop, company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";
  const isNewEntry = !editEntryId;
  const debouncedNote = useDebounce(note, 500);
  const parsedSelectedDate = dayjs(selectedFullDate);
  const displaySelectedDate = parsedSelectedDate.isValid()
    ? parsedSelectedDate.format(`dddd, ${dateFormat}`)
    : selectedFullDate;
  const favoriteStorageKey = `miru_time_entry_favorites_${selectedEmployeeId}`;
  const [favoriteShortcutKeys, setFavoriteShortcutKeys] = useState<string[]>(
    () => {
      if (typeof window === "undefined") return [];

      try {
        const saved = localStorage.getItem(favoriteStorageKey);

        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
  );

  const allEntries = Object.values(entryList || {})
    .flat()
    .sort((left: any, right: any) => {
      const leftTime = dayjs(left.work_date).valueOf();
      const rightTime = dayjs(right.work_date).valueOf();

      if (rightTime !== leftTime) return rightTime - leftTime;

      return (right.id || 0) - (left.id || 0);
    });

  const recentEntryShortcuts = allEntries
    .reduce((entries: any[], entry: any) => {
      const shortcutKey = [
        entry.project_id,
        entry.task_type || "development",
        (entry.note || "").trim(),
        entry.duration,
      ].join("|");

      if (entries.some(item => item.shortcutKey === shortcutKey)) {
        return entries;
      }

      entries.push({
        ...entry,
        shortcutKey,
      });

      return entries;
    }, [])
    .slice(0, 4);
  const latestTrackedEntry = allEntries[0];
  const favoriteEntryShortcuts = recentEntryShortcuts.filter(entry =>
    favoriteShortcutKeys.includes(entry.shortcutKey)
  );

  const visibleRecentEntryShortcuts = recentEntryShortcuts.filter(
    entry => !favoriteShortcutKeys.includes(entry.shortcutKey)
  );

  const handleFillData = () => {
    if (!editEntryId) return;
    const isoDate = dayjs(selectedFullDate).format("YYYY-MM-DD");
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
    if (!client) {
      setProjectBillable(false);
      setProject("");

      return setProjectId(0);
    }

    if (!projects || !projects[client] || projects[client].length === 0) {
      setProjectBillable(false);
      if (project) setProject("");

      return setProjectId(0);
    }

    const selectedProject = projects[client].find(
      currentProject => currentProject.name === project
    );

    if (selectedProject) {
      setProjectId(Number(selectedProject.id));
      setProjectBillable(Boolean(selectedProject.billable));

      return;
    }

    const fallbackProject = projects[client][0];

    if (fallbackProject) {
      setProject(fallbackProject.name);
      setProjectId(Number(fallbackProject.id));
      setProjectBillable(Boolean(fallbackProject.billable));
    }
  }, [project, client, projects]);

  const handleDurationChange = val => {
    setDuration(val);
  };

  const getPayload = () => ({
    work_date: dayjs(selectedFullDate).format("YYYY-MM-DD"),
    duration: minFromHHMM(duration),
    note,
    task_type: taskType,
    bill_status: projectBillable ? "unbilled" : "non_billable",
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

      const fetchEntriesRes = await refreshVisibleEntries();

      if (!fetchEntriesRes) {
        await handleRelocateEntry(selectedFullDate, res.data.entry);
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
        await refreshVisibleEntries();
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      favoriteStorageKey,
      JSON.stringify(favoriteShortcutKeys)
    );
  }, [favoriteShortcutKeys, favoriteStorageKey]);

  const applyRecentEntry = entry => {
    setClient(entry.client);
    setProject(entry.project);
    setProjectId(entry.project_id);
    setTaskType(entry.task_type || "development");
    setNote(entry.note || "");
    setDuration(minToHHMM(entry.duration || 0));
  };

  const toggleFavoriteShortcut = shortcutKey => {
    setFavoriteShortcutKeys(current =>
      current.includes(shortcutKey)
        ? current.filter(key => key !== shortcutKey)
        : [...current, shortcutKey].slice(-6)
    );
  };

  const handleDuplicateLastEntry = async () => {
    if (!latestTrackedEntry) return;

    try {
      setSubmitting(true);
      const res = await timesheetEntryApi.create(
        {
          project_id: latestTrackedEntry.project_id,
          timesheet_entry: {
            work_date: dayjs(selectedFullDate).format("YYYY-MM-DD"),
            duration: latestTrackedEntry.duration,
            note: latestTrackedEntry.note,
            task_type: latestTrackedEntry.task_type || "development",
            bill_status:
              latestTrackedEntry.bill_status === "billed"
                ? "unbilled"
                : latestTrackedEntry.bill_status,
          },
        },
        selectedEmployeeId
      );

      if (res.status === 200) {
        await refreshVisibleEntries();
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

  return isDesktop ? (
    <Card className="weekly-entries w-full shadow-sm border border-border bg-card backdrop-blur-sm rounded-lg">
      <div className={`p-8 ${editEntryId ? "mt-4" : ""}`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {i18n.t("timeTracking.savingTo")}
            </p>
            <p className="text-base font-semibold text-foreground">
              {displaySelectedDate}
            </p>
          </div>
          {isNewEntry && latestTrackedEntry && (
            <Button
              variant="outline"
              size="sm"
              data-testid="duplicate-last-entry"
              disabled={submitting}
              onClick={handleDuplicateLastEntry}
            >
              {i18n.t("timeTracking.copyLastWeek")}
            </Button>
          )}
        </div>
        {isNewEntry && favoriteEntryShortcuts.length > 0 && (
          <div className="mb-4 rounded-lg border border-border bg-card/60 px-4 py-4">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {i18n.t("timeTracking.favorites")}
              </p>
              <p className="text-sm font-medium text-foreground">
                {i18n.t("timeTracking.favoriteShortcutsHint")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteEntryShortcuts.map(entry => (
                <div
                  key={entry.shortcutKey}
                  className="flex max-w-full items-center gap-1 rounded-md border border-border bg-background p-1"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-testid="favorite-entry-shortcut"
                    className="h-auto max-w-full justify-start whitespace-normal px-3 py-2 text-left"
                    onClick={() => applyRecentEntry(entry)}
                  >
                    <span className="truncate">
                      {entry.client} / {entry.project} ·{" "}
                      {minToHHMM(entry.duration)}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    data-testid="favorite-entry-toggle"
                    onClick={() => toggleFavoriteShortcut(entry.shortcutKey)}
                  >
                    <StarHalf className="h-4 w-4" weight="fill" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {isNewEntry && visibleRecentEntryShortcuts.length > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-card/60 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {i18n.t("timeTracking.recentShortcuts")}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {i18n.t("timeTracking.recentShortcutsHint")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleRecentEntryShortcuts.map(entry => (
                <div key={entry.shortcutKey}>
                  <div className="flex max-w-full items-center gap-1 rounded-md border border-border bg-background p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-testid="recent-entry-shortcut"
                      className="h-auto max-w-full justify-start whitespace-normal px-3 py-2 text-left"
                      onClick={() => applyRecentEntry(entry)}
                    >
                      <span className="truncate">
                        {entry.client} / {entry.project} ·{" "}
                        {minToHHMM(entry.duration)}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      data-testid="favorite-entry-toggle"
                      onClick={() => toggleFavoriteShortcut(entry.shortcutKey)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client and Project Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="client"
                  className="text-sm font-semibold text-foreground"
                >
                  {i18n.t("client")}
                </Label>
                <Select
                  value={client}
                  onValueChange={value => {
                    const defaultProject =
                      (projects && projects[value] && projects[value][0]) ||
                      null;

                    setClient(value);
                    setProject(defaultProject?.name || "");
                    setProjectId(
                      defaultProject ? Number(defaultProject.id) : 0
                    );
                    setProjectBillable(Boolean(defaultProject?.billable));
                  }}
                >
                  <SelectTrigger
                    id="client"
                    aria-label={i18n.t("client")}
                    className="h-12 client-select"
                  >
                    <SelectValue
                      placeholder={i18n.t("timeTracking.selectClient")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(clients) &&
                      clients.map((client, i) => (
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
                  {i18n.t("project")}
                </Label>
                <Select
                  value={project}
                  onValueChange={value => {
                    const selectedProject =
                      client &&
                      projects[client] &&
                      projects[client].find(
                        currentProject => currentProject.name === value
                      );

                    setProject(value);
                    setProjectId(
                      selectedProject ? Number(selectedProject.id) : 0
                    );
                    setProjectBillable(Boolean(selectedProject?.billable));
                  }}
                  disabled={!client}
                >
                  <SelectTrigger
                    id="project"
                    aria-label={i18n.t("project")}
                    className={cn(
                      "h-12 project-select",
                      !client && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <SelectValue
                      placeholder={i18n.t("timeTracking.selectProject")}
                    />
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
                {i18n.t("description")}
              </Label>
              <Textarea
                name="notes"
                placeholder={i18n.t("timeTracking.addNoteHere")}
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
                  {i18n.t("timeTracking.timeSpent")}
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
                  {i18n.t("timeTracking.taskType")}
                </Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="h-12">
                    <SelectValue
                      placeholder={i18n.t("timeTracking.selectTaskType")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">
                      {i18n.t("taskTypes.development")}
                    </SelectItem>
                    <SelectItem value="meeting">
                      {i18n.t("taskTypes.meeting")}
                    </SelectItem>
                    <SelectItem value="research">
                      {i18n.t("taskTypes.research")}
                    </SelectItem>
                    <SelectItem value="planning">
                      {i18n.t("taskTypes.planning")}
                    </SelectItem>
                    <SelectItem value="testing">
                      {i18n.t("taskTypes.testing")}
                    </SelectItem>
                    <SelectItem value="documentation">
                      {i18n.t("taskTypes.documentation")}
                    </SelectItem>
                    <SelectItem value="review">
                      {i18n.t("taskTypes.codeReview")}
                    </SelectItem>
                    <SelectItem value="debugging">
                      {i18n.t("taskTypes.debugging")}
                    </SelectItem>
                    <SelectItem value="deployment">
                      {i18n.t("taskTypes.deployment")}
                    </SelectItem>
                    <SelectItem value="support">
                      {i18n.t("taskTypes.support")}
                    </SelectItem>
                    <SelectItem value="training">
                      {i18n.t("taskTypes.training")}
                    </SelectItem>
                    <SelectItem value="other">
                      {i18n.t("taskTypes.other")}
                    </SelectItem>
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
                  {i18n.t("timeTracking.saveEntry")}
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
                  {i18n.t("timeTracking.updateEntry")}
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
                {i18n.t("cancel")}
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
  refreshVisibleEntries: () => Promise<any>;
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
