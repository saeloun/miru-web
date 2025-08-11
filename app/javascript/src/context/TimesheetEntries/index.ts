import dayjs from "dayjs";
import { createContext, useContext } from "react";
import { getValueFromLocalStorage } from "utils/storage";

const initialNote = getValueFromLocalStorage("note") || "";
const initialDuration = getValueFromLocalStorage("duration") || "";
const initialClient = getValueFromLocalStorage("client") || "";
const initialProject = getValueFromLocalStorage("project") || "";
const initialProjectId = parseInt(getValueFromLocalStorage("projectId") || "0");
// const _initialBillable = getValueFromLocalStorage("billable") === "true";
const initialProjectBillable =
  getValueFromLocalStorage("projectBillable") === "true";

// Context Creation
const initialState: any = {
  view: "month",
  entryList: {},
  dayInfo: [],
  currentYear: dayjs().year(),
  getPayload: () => {},
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
  handleEdit: () => {},
  handleSave: () => {},
  handleDuplicate: (_id: any) => {},
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
  setDuration: () => {},
  handleAddEntryDateChange: (_date: any) => {},
  handleNextDay: () => {},
  handlePreDay: () => {},
  handleNextWeek: () => {},
  handlePrevWeek: () => {},
  setDisplayDatePicker: () => {},
  selectedDate: dayjs().format("YYYY-MM-DD"),
  setBillable: () => {},
  setClient: () => {},
  setEditEntryId: () => {},
  setNewEntryView: () => {},
  setNewTimeoffEntryView: () => {},
  setNote: () => {},
  setProject: () => {},
  setUpdateView: () => {},
  setSelectedDate: () => {},
  setSubmitting: () => {},
  setSelectedEmployeeId: () => {},
  setLeaveTypes: () => {},
  setLeaveTypeHashObj: () => {},
  setEditTimeoffEntryId: () => {},
  setEntryList: () => {},
};
export const TimesheetEntriesContext = createContext(initialState);

// Custom Hooks
export const useTimesheetEntries = () => useContext(TimesheetEntriesContext);
