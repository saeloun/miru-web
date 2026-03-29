import { createContext, useContext } from "react";

import dayjs from "dayjs";
import { getValueFromLocalStorage } from "utils/storage";

const initialNote = getValueFromLocalStorage("note") || "";
const initialDuration = getValueFromLocalStorage("duration") || "";
const initialClient = getValueFromLocalStorage("client") || "";
const initialProject = getValueFromLocalStorage("project") || "";
const initialProjectId = parseInt(getValueFromLocalStorage("projectId") || "0");
const initialProjectBillable =
  getValueFromLocalStorage("projectBillable") === "true";

// Context Creation
const initialState: any = {
  view: "month",
  entryList: {},
  dayInfo: [],
  currentYear: dayjs().year(),
  getPayload: () => {
    /* Placeholder - overridden by provider */
  },
  submitting: false,
  leaveTypes: [],
  leaveTypeHashObj: {},
  isWeeklyEditing: false,
  billable: false,
  client: initialClient,
  clients: [],
  monthData: [],
  weeklyData: [],
  duration: initialDuration,
  editTimeoffEntryId: 0,
  editEntryId: "",
  handleEdit: () => {
    /* Placeholder - overridden by provider */
  },
  handleSave: () => {
    /* Placeholder - overridden by provider */
  },
  handleDuplicate: (_id: any) => {
    /* Placeholder - overridden by provider */
  },
  note: initialNote,
  project: initialProject,
  projectId: initialProjectId,
  projects: {},
  projectBillable: initialProjectBillable,
  displayDatePicker: false,
  employeeOptions: [],
  holidayList: [],
  holidaysHashObj: {},
  hasNationalHoliday: false,
  hasOptionalHoliday: false,
  setDuration: () => {
    /* Placeholder - overridden by provider */
  },
  handleAddEntryDateChange: (_date: any) => {
    /* Placeholder - overridden by provider */
  },
  handleNextDay: () => {
    /* Placeholder - overridden by provider */
  },
  handlePreDay: () => {
    /* Placeholder - overridden by provider */
  },
  handleNextWeek: () => {
    /* Placeholder - overridden by provider */
  },
  handlePrevWeek: () => {
    /* Placeholder - overridden by provider */
  },
  setDisplayDatePicker: () => {
    /* Placeholder - overridden by provider */
  },
  selectedDate: dayjs().format("YYYY-MM-DD"),
  setBillable: () => {
    /* Placeholder - overridden by provider */
  },
  setClient: () => {
    /* Placeholder - overridden by provider */
  },
  setEditEntryId: () => {
    /* Placeholder - overridden by provider */
  },
  setNewEntryView: () => {
    /* Placeholder - overridden by provider */
  },
  setNewTimeoffEntryView: () => {
    /* Placeholder - overridden by provider */
  },
  setNote: () => {
    /* Placeholder - overridden by provider */
  },
  setProject: () => {
    /* Placeholder - overridden by provider */
  },
  setUpdateView: () => {
    /* Placeholder - overridden by provider */
  },
  setSelectedDate: () => {
    /* Placeholder - overridden by provider */
  },
  setSubmitting: () => {
    /* Placeholder - overridden by provider */
  },
  setSelectedEmployeeId: () => {
    /* Placeholder - overridden by provider */
  },
  setLeaveTypes: () => {
    /* Placeholder - overridden by provider */
  },
  setLeaveTypeHashObj: () => {
    /* Placeholder - overridden by provider */
  },
  setEditTimeoffEntryId: () => {
    /* Placeholder - overridden by provider */
  },
  setEntryList: () => {
    /* Placeholder - overridden by provider */
  },
};
export const TimesheetEntriesContext = createContext(initialState);

// Custom Hooks
export const useTimesheetEntries = () => useContext(TimesheetEntriesContext);
