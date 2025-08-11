import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

import { month, quarters } from "../../../../utils/dateUtil";

dayjs.extend(quarterOfYear);

const getQuarter = isCurrentQuarter => {
  const currentDate = new Date();
  const monthCount = dayjs(currentDate);
  const monthStr = month[monthCount.month()];

  let quarter = 1;
  Object.keys(quarters).map(item => {
    if (quarters[item].months.includes(monthStr)) {
      quarter = parseInt(item);
    }
  });

  if (!isCurrentQuarter && quarter == 1) {
    quarter = 4;
  } else if (!isCurrentQuarter) {
    quarter -= 1;
  }

  return isCurrentQuarter
    ? `This Quarter (${quarters[quarter].startDay} - ${quarters[quarter].endDay})`
    : `Last Quarter (${quarters[quarter].startDay} - ${quarters[quarter].endDay})`;
};

const getDateRangeOptions = () => {
  const thisQuarter = getQuarter(true);
  const previousQuarter = getQuarter(false);

  return [
    { value: "this_quarter", label: thisQuarter },
    { value: "last_quarter", label: previousQuarter },
    { value: "this_year", label: "This Year" },
    { value: "last_year", label: "Last Year" },
    { value: "custom", label: "Custom" },
    { value: "all_time", label: "All Time" },
  ];
};

const dateRangeOptions = [...getDateRangeOptions()];

const customDateFilter = "customDateFilter";

export { dateRangeOptions, customDateFilter, getQuarter };
