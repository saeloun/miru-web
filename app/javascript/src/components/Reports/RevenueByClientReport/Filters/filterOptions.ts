import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { i18n } from "../../../../i18n";

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
    ? `${i18n.t("thisQuarter")} (${quarters[quarter].startDay} - ${
        quarters[quarter].endDay
      })`
    : `${i18n.t("lastQuarter")} (${quarters[quarter].startDay} - ${
        quarters[quarter].endDay
      })`;
};

const getDateRangeOptions = () => {
  const thisQuarter = getQuarter(true);
  const previousQuarter = getQuarter(false);

  return [
    { value: "this_quarter", label: thisQuarter },
    { value: "last_quarter", label: previousQuarter },
    { value: "this_year", label: i18n.t("thisYear") },
    { value: "last_year", label: i18n.t("lastYear") },
    { value: "custom", label: i18n.t("customRange") },
    { value: "all_time", label: i18n.t("allTime") },
  ];
};

const customDateFilter = "customDateFilter";

export { customDateFilter, getDateRangeOptions, getQuarter };
