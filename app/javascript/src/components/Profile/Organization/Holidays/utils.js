import dayjs from "dayjs";

export const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    padding: "0",
    borderColor: state.isFocused ? "#5E58F1" : "#D7DEE5",
    borderWidth: "1px",
    boxShadow: state.isFocused && "0 0 0 1px #5E58F1",
    "&:hover": {
      borderColor: "#5E58F1",
    },
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
    zIndex: 5,
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-30%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  }),
  option: provided => ({
    ...provided,
    cursor: "pointer",
    "&:hover": {
      background: "#D7DEE5",
    },
  }),
};

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
