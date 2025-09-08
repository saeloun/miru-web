import { createContext, useContext } from "react";

import dayjs from "dayjs";
import { getValueFromLocalStorage } from "utils/storage";

const initialNote = getValueFromLocalStorage("note") || "";
const initialDuration = getValueFromLocalStorage("duration") || "";
const initialClient = getValueFromLocalStorage("client") || "";
const initialProject = getValueFromLocalStorage("project") || "";
const initialProjectId = parseInt(getValueFromLocalStorage("projectId") || "0");
const initialBillable = getValueFromLocalStorage("billable") === "true";
const initialProjectBillable =
  getValueFromLocalStorage("projectBillable") === "true";

const initialState: any = {
  getPayload: () => {
    /* Placeholder - overridden by provider */
  },
  submitting: false,
  billable: initialBillable,
  client: initialClient,
  duration: initialDuration,
  handleEdit: () => {
    /* Placeholder - overridden by provider */
  },
  handleSave: () => {
    /* Placeholder - overridden by provider */
  },
  note: initialNote,
  project: initialProject,
  projectId: initialProjectId,
  projectBillable: initialProjectBillable,
  displayDatePicker: false,
  setDuration: () => {
    /* Placeholder - overridden by provider */
  },
  setNewEntryView: () => {
    /* Placeholder - overridden by provider */
  },
  setIsWeeklyEditing: () => {
    /* Placeholder - overridden by provider */
  },
  setDisplayDatePicker: () => {
    /* Placeholder - overridden by provider */
  },
  setNewRowView: () => {
    /* Placeholder - overridden by provider */
  },
  selectedDate: dayjs().format("YYYY-MM-DD"),
  setBillable: () => {
    /* Placeholder - overridden by provider */
  },
  setClient: () => {
    /* Placeholder - overridden by provider */
  },
  setNote: () => {
    /* Placeholder - overridden by provider */
  },
  setProject: () => {
    /* Placeholder - overridden by provider */
  },
  setSubmitting: () => {
    /* Placeholder - overridden by provider */
  },
  setSelectedDate: () => {
    /* Placeholder - overridden by provider */
  },
  handleDeleteEntry: () => {
    /* Placeholder - overridden by provider */
  },
};

export const TimeEntryFormContext = createContext(initialState);

// Custom Hooks
export const useTimeEntryForm = () => useContext(TimeEntryFormContext);
