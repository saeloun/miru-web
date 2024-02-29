/* eslint-disable */
import dayjs from "dayjs";
import { createContext, useContext } from "react";
import { getValueFromLocalStorage } from "utils/storage";

const initialNote = getValueFromLocalStorage("note") || "";
const initialDuration = getValueFromLocalStorage("duration") || "";
const initialClient = getValueFromLocalStorage("client") || "";
const initialProject = getValueFromLocalStorage("project") || "";
const initialProjectId = parseInt(getValueFromLocalStorage("projectId") || "0");
const initialBillable = getValueFromLocalStorage("billable") === "true";
const initialProjectBillable =
  getValueFromLocalStorage("projectBillable") === "true";

// Context Creation
const initialState: any = {
  view: "month",
  entryList: {},
  dayInfo: [],
  currentYear: dayjs().year(),
  getPayload: () => {}, //eslint-disable-line
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
  handleEdit: () => {}, //eslint-disable-line
  handleSave: () => {}, //eslint-disable-line
  handleDuplicate: (id: any) => {}, //eslint-disable-line
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
  setDuration: () => {}, //eslint-disable-line
  handleAddEntryDateChange: (date: any) => {}, //eslint-disable-line
  handleNextDay: () => {}, //eslint-disable-line
  handlePreDay: () => {}, //eslint-disable-line
  handleNextWeek: () => {}, //eslint-disable-line
  handlePrevWeek: () => {}, //eslint-disable-line
  setDisplayDatePicker: () => {}, //eslint-disable-line
  selectedDate: dayjs().format("YYYY-MM-DD"),
  setBillable: () => {}, //eslint-disable-line
  setClient: () => {}, //eslint-disable-line
  setEditEntryId: () => {}, //eslint-disable-line
  setNewEntryView: () => {}, //eslint-disable-line
  setNewTimeoffEntryView: () => {}, //eslint-disable-line
  setNote: () => {}, //eslint-disable-line
  setProject: () => {}, //eslint-disable-line
  setUpdateView: () => {}, //eslint-disable-line
  setSelectedDate: () => {}, //eslint-disable-line
  setSubmitting: () => {}, //eslint-disable-line
  setSelectedEmployeeId: () => {}, //eslint-disable-line
  setLeaveTypes: () => {}, //eslint-disable-line
  setLeaveTypeHashObj: () => {}, //eslint-disable-line
  setEditTimeoffEntryId: () => {}, //eslint-disable-line
  setEntryList: () => {}, //eslint-disable-line
};
export const TimesheetEntriesContext = createContext(initialState);

// Custom Hooks
export const useTimesheetEntries = () => useContext(TimesheetEntriesContext);
