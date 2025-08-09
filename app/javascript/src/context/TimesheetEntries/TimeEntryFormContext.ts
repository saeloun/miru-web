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
  getPayload: () => {}, //eslint-disable-line
  submitting: false,
  billable: initialBillable,
  client: initialClient,
  duration: initialDuration,
  handleEdit: () => {}, //eslint-disable-line
  handleSave: () => {}, //eslint-disable-line
  note: initialNote,
  project: initialProject,
  projectId: initialProjectId,
  projectBillable: initialProjectBillable,
  displayDatePicker: false,
  setDuration: () => {}, //eslint-disable-line
  setNewEntryView: () => {}, //eslint-disable-line
  setIsWeeklyEditing: () => {}, //eslint-disable-line
  setDisplayDatePicker: () => {}, //eslint-disable-line
  setNewRowView: () => {}, //eslint-disable-line
  selectedDate: dayjs().format("YYYY-MM-DD"),
  setBillable: () => {}, //eslint-disable-line
  setClient: () => {}, //eslint-disable-line
  setNote: () => {}, //eslint-disable-line
  setProject: () => {}, //eslint-disable-line
  setSubmitting: () => {}, //eslint-disable-line
  setSelectedDate: () => {}, //eslint-disable-line
  handleDeleteEntry: () => {}, //eslint-disable-line
};

export const TimeEntryFormContext = createContext(initialState);

// Custom Hooks
export const useTimeEntryForm = () => useContext(TimeEntryFormContext);
