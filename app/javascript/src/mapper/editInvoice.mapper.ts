import { lineTotalCalc } from "helpers";

export const unmapLineItems = (input) => input.map(item => ({
  ...item,
  lineTotal: lineTotalCalc(item.quantity, item.rate),
  timesheet_entry_id: item.timesheetEntryId
}));
