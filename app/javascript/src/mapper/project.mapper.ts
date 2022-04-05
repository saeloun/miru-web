
const getMember = (input:any) => input.map((elem) => ({
  hourlyRate: elem.hourly_rate,
  id: elem.id,
  minutes: elem.minutes_logged,
  name: elem.name
}));

export const unmapper = (data:any = {}) => ({
  totalMinutes: data.total_minutes_logged,
  client: data.client,
  id: data.id,
  is_billable: data.is_billable,
  members: getMember(data.members),
  name: data.name
});
