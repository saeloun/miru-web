const getMember = (input: any) =>
  input
    .filter(
      (elem, index, self) =>
        self.findIndex(
          candidate => String(candidate.id) === String(elem.id)
        ) === index
    )
    .map(elem => ({
      hourlyRate: elem.hourly_rate,
      id: elem.id,
      minutes: elem.minutes_logged,
      name: elem.name,
      cost: elem.cost,
    }));

export const unmapper = (data: any = {}) => ({
  totalMinutes: data.total_minutes_logged,
  client: data.client,
  id: data.id,
  is_billable: data.is_billable,
  members: getMember(data.members),
  name: data.name,
  currency: data.overdue_and_outstanding_amounts?.currency,
  client_currency: data.overdue_and_outstanding_amounts?.client_currency,
  overdueOutstandingAmount: data.overdue_and_outstanding_amounts,
});
