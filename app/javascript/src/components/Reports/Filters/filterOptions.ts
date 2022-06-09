import dayjs from "dayjs";
import { month, getDayWithSuffix } from "../../../utils/dateUtil";

const getWeek = (isCurrentWeek) => {
  const currentDate = new Date();

  const first = currentDate.getDate() - currentDate.getDay();
  const weekFirstDay = isCurrentWeek ? first : first - 7;
  const last = weekFirstDay + 6;

  const firstday = dayjs(new Date(currentDate.setDate(weekFirstDay)));
  const lastday = dayjs(new Date(currentDate.setDate(last)));
  const completeCurrentDay = `${getDayWithSuffix(firstday.date())} ${month[firstday.month()]}`;
  const completeLastWeekDay = `${getDayWithSuffix(lastday.date())} ${month[lastday.month()]}`;
  return isCurrentWeek ? `This Week (${completeCurrentDay} - ${completeLastWeekDay})` :
    `Last Week (${completeCurrentDay} - ${completeLastWeekDay})`;
};

const getMonth = (isCurrentMonth) => {
  const currentDate = new Date();

  const monthCount = isCurrentMonth ? dayjs(currentDate) : dayjs(currentDate).subtract(1, "month");
  const monthStr = month[monthCount.month()];
  const totalDaysOfCurrentMonth = dayjs(monthCount).daysInMonth();
  const lastdayOfMonth = totalDaysOfCurrentMonth === 30 ? `${totalDaysOfCurrentMonth}th` : `${totalDaysOfCurrentMonth}st`;

  return isCurrentMonth ? `This Month (1st ${monthStr} - ${lastdayOfMonth} ${monthStr})` :
    `Last Month (1st ${monthStr} - ${lastdayOfMonth} ${monthStr})`;
};

const getDateRangeOptions = () => {
  const thisWeek = getWeek(true);
  const thisMonth = getMonth(true);
  const previousMonth = getMonth(false);
  const previousweek = getWeek(false);

  return [
    { value: "this_month", label: thisMonth },
    { value: "last_month", label: previousMonth },
    { value: "this_week", label: thisWeek },
    { value: "last_week", label: previousweek }
  ];
};

const dateRangeOptions = [
  ...getDateRangeOptions()
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
  { value: "week", label: "Week" }
];

export {
  dateRangeOptions,
  statusOption,
  groupBy,
  getMonth
};
