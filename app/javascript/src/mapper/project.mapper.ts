
const getMember = (input:any) => input.map((elem) => ({
  formattedHourlyRate: elem.formatted_hourly_rate,
  id: elem.id,
  minutes: elem.minutes_logged,
  name: elem.name,
  formattedCost: elem.formatted_cost
}));

export const unmapper = (data:any = {}) => ({
  totalMinutes: data.total_minutes_logged,
  client: data.client,
  id: data.id,
  is_billable: data.is_billable,
  members: getMember(data.members),
  name: data.name,
  overdueOutstandingAmount: data.overdue_and_outstanding_amounts
});
