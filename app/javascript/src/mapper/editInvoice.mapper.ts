export const unmapLineItems = (input) => input.map(item => ({
  ...item,
  lineTotal: ((Number(item.quantity) / 60) * Number(item.rate)).toFixed(2),
  timesheet_entry_id: item.timesheetEntryId
}));
