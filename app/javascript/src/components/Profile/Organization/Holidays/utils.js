import dayjs from "dayjs";

export const companyDateFormat = dateFormat => {
  switch (dateFormat) {
    case "DD-MM-YYYY":
      return "DD.MM.YYYY";
    case "YYYY-MM-DD":
      return "YYYY.MM.DD";
    case "MM-DD-YYYY":
      return "MM.DD.YYYY";
    default:
      return "DD.MM.YYYY";
  }
};

export const makePayload = (totalHolidayList, dateFormat) =>
  totalHolidayList.map(holiday => ({
    ...holiday,
    date:
      dateFormat == "DD.MM.YYYY"
        ? holiday.date
        : dayjs(holiday.date).format("DD.MM.YYYY"),
  }));
