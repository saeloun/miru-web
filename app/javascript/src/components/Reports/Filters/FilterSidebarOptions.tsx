import dayjs from "dayjs";
import { month, getDayWithSuffix } from "utils/dateUtil";

const getWeek = isCurrentWeek => {
  const currentDate = new Date();

  const first = currentDate.getDate() - currentDate.getDay();
  const weekFirstDay = isCurrentWeek ? first : first - 7;
  const last = weekFirstDay + 7;

  const firstday = dayjs(new Date(currentDate.setDate(weekFirstDay)));
  // currentDate wont have current date after the above step
  const lastday = dayjs(new Date(new Date().setDate(last)));
  const completeCurrentDay = `${getDayWithSuffix(firstday.date())} ${
    month[firstday.month()]
  }`;

  const completeLastWeekDay = `${getDayWithSuffix(lastday.date())} ${
    month[lastday.month()]
  }`;

  return {
    from_date: `${completeCurrentDay}`,
    to_date: `${completeLastWeekDay}`,
  };
};

const getMonth = isCurrentMonth => {
  const currentDate = new Date();

  const monthCount = isCurrentMonth
    ? dayjs(currentDate)
    : dayjs(currentDate).subtract(1, "month");
  const monthStr = month[monthCount.month()];
  const totalDaysOfCurrentMonth = dayjs(monthCount).daysInMonth();
  const lastdayOfMonth =
    totalDaysOfCurrentMonth === 31
      ? `${totalDaysOfCurrentMonth}st`
      : `${totalDaysOfCurrentMonth}th`;

  return {
    from_date: `1st ${monthStr}`,
    to_date: `${lastdayOfMonth} ${monthStr}`,
  };
};

const getDateRangeOptions = () => {
  const thisWeek = getWeek(true);
  const thisMonth = getMonth(true);
  const previousMonth = getMonth(false);
  const previousweek = getWeek(false);

  return [
    {
      value: "this_month",
      label: `This Month (${thisMonth.from_date} - ${thisMonth.to_date})`,
      from: thisMonth.from_date,
      to: thisMonth.to_date,
    },
    {
      value: "last_month",
      label: `Last Month (${previousMonth.from_date} - ${previousMonth.to_date})`,
      from: previousMonth.from_date,
      to: previousMonth.to_date,
    },
    {
      value: "this_week",
      label: `This Week (${thisWeek.from_date} - ${thisWeek.to_date})`,
      from: thisWeek.from_date,
      to: thisWeek.to_date,
    },
    {
      value: "last_week",
      label: `Last Week (${previousweek.from_date} - ${previousweek.to_date})`,
      from: previousweek.from_date,
      to: previousweek.to_date,
    },
    { value: "custom", label: "Custom" },
  ];
};

const statusOptions = [
  { value: "draft", label: "DRAFT" },
  { value: "sent", label: "SENT" },
  { value: "viewed", label: "VIEWED" },
  { value: "paid", label: "PAID" },
  { value: "declined", label: "DECLINED" },
  { value: "overdue", label: "OVERDUE" },
];

const dateRangeOptions = [...getDateRangeOptions()];

export { dateRangeOptions, statusOptions };
