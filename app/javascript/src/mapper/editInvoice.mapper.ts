export const unmapLineItems = (input) => input.map(item => ({
  ...item,
  lineTotal: ((Number(item.quantity) / 60) * Number(item.rate)),
  timesheet_entry_id: item.timesheetEntryId
}));
