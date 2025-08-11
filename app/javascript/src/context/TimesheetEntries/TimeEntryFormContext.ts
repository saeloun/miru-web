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
  getPayload: () => {},
  submitting: false,
  billable: initialBillable,
  client: initialClient,
  duration: initialDuration,
  handleEdit: () => {},
  handleSave: () => {},
  note: initialNote,
  project: initialProject,
  projectId: initialProjectId,
  projectBillable: initialProjectBillable,
  displayDatePicker: false,
  setDuration: () => {},
  setNewEntryView: () => {},
  setIsWeeklyEditing: () => {},
  setDisplayDatePicker: () => {},
  setNewRowView: () => {},
  selectedDate: dayjs().format("YYYY-MM-DD"),
  setBillable: () => {},
  setClient: () => {},
  setNote: () => {},
  setProject: () => {},
  setSubmitting: () => {},
  setSelectedDate: () => {},
  handleDeleteEntry: () => {},
};

export const TimeEntryFormContext = createContext(initialState);

// Custom Hooks
export const useTimeEntryForm = () => useContext(TimeEntryFormContext);
