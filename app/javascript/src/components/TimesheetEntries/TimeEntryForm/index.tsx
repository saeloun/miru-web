import React, { useState, useEffect, useRef, MutableRefObject } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { TimeEntryFormContext } from "context/TimesheetEntries/TimeEntryFormContext";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { minFromHHMM, minToHHMM, useDebounce, useOutsideClick } from "helpers";
import { getValueFromLocalStorage, setToLocalStorage } from "utils/storage";

import DesktopTimeEntryForm from "./DesktopTimeEntryForm";
import MobileEntryForm from "./MobileEntryForm";

const AddEntry = () => {
  const {
    editEntryId,
    selectedEmployeeId,
    fetchEntries,
    setNewEntryView,
    projects,
    entryList,
    selectedFullDate,
    setEditEntryId,
    handleAddEntryDateChange,
    handleFilterEntry,
    handleRelocateEntry,
    setSelectedFullDate,
    setUpdateView,
    handleDeleteEntry,
    fetchEntriesOfMonths,
    removeLocalStorageItems,
  } = useTimesheetEntries();

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
    const entry = entryList[selectedFullDate]?.find(
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

    const selectedProject = projects[client]?.find(
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
        fetchEntriesOfMonths();
      }

      if (fetchEntriesRes) {
        setNewEntryView(false);
        setUpdateView(true);
        handleAddEntryDateChange(dayjs(selectedDate));
      }
    }
  };

  const handleEdit = async () => {
    const tsEntry = getPayload();
    const updateRes = await timesheetEntryApi.update(editEntryId, {
      project_id: projectId,
      timesheet_entry: tsEntry,
    });

    if (updateRes.status >= 200 && updateRes.status < 300) {
      if (selectedDate !== selectedFullDate) {
        await handleFilterEntry(selectedFullDate, editEntryId);
        await handleRelocateEntry(selectedDate, updateRes.data.entry);
        if (!isDesktop) {
          fetchEntriesOfMonths();
        }
      } else {
        await fetchEntries(selectedDate, selectedDate);
        fetchEntriesOfMonths();
      }
      setEditEntryId(0);
      setNewEntryView(false);
      setUpdateView(true);
      handleAddEntryDateChange(dayjs(selectedDate));
      setSelectedFullDate(dayjs(selectedDate).format("YYYY-MM-DD"));
    }
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

  return (
    <TimeEntryFormContext.Provider
      value={{
        getPayload,
        projectBillable,
        displayDatePicker,
        setDisplayDatePicker,
        project,
        projectId,
        submitting,
        setProject,
        client,
        setClient,
        note,
        setNote,
        billable,
        setBillable,
        selectedDate,
        setSelectedDate,
        duration,
        setDuration,
        handleSave,
        handleEdit,
        handleDeleteEntry,
        setSubmitting,
      }}
    >
      {isDesktop ? <DesktopTimeEntryForm /> : <MobileEntryForm />}
    </TimeEntryFormContext.Provider>
  );
};
export default AddEntry;
