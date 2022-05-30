export const unmapLineItems = (input) => {
  return input.map(item => {
    return {
      ...item,
      lineTotal: ((Number(item.qty) / 60) * Number(item.rate)),
      timesheet_entry_id: item.timesheetEntryId
    }
  })
}
