import dayjs from "dayjs";

const getDateRange = () => {
  const date = new Date();
  const totalDaysOfCurrentMonth = dayjs(date).daysInMonth();
  const currentMonthName = date.toLocaleString('en-us', { month: 'short' });
  const lastdayOfMonth = totalDaysOfCurrentMonth === 30 ? `${totalDaysOfCurrentMonth}th` : `${totalDaysOfCurrentMonth}st`
  return [
    { value: "this_month", label: `This month (1st ${currentMonthName} -  ${lastdayOfMonth} ${currentMonthName})` }
  ];
}

const dateRangeOptions = [
  { value: "", label: "All" },
  ...getDateRange(),
  { value: "last_month", label: "Last Month (1st Nov - 30th Nov)" },
  { value: "this_week", label: "This Week (27th Dec - 2nd Jan)" },
  { value: "last_week", label: "Last Week (20th Dec - 26th Dec)" }
];

const statusOption = [
  { value: "billed", label: "BILLED" },
  { value: "unbilled", label: "UNBILLED" },
  { value: "nonBilled", label: "NON BILLABLE" }
];

const groupBy = [
  { value: "", label: "None" },
  { value: "team_member", label: "Team member" },
  { value: "client", label: "Client" },
  { value: "project", label: "Project" },
  { value: "Week", label: "Week" }
];

export {
  dateRangeOptions,
  statusOption,
  groupBy
};
