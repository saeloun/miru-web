import dayjs from "dayjs";

import {
  getSelectControlStyles,
  getSelectMenuStyles,
  selectPalette,
} from "common/CustomReactSelectStyle/shared";

export const customStyles = {
  control: (provided, state) =>
    getSelectControlStyles(provided, {
      borderColor: state.isFocused ? selectPalette.focus : selectPalette.border,
      isFocused: state.isFocused,
    }),
  menu: provided =>
    getSelectMenuStyles(provided, {
      fontSize: "14px",
      zIndex: 50,
    }),
  menuList: provided => ({
    ...provided,
    backgroundColor: selectPalette.menuBackground,
    paddingTop: 6,
    paddingBottom: 6,
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-30%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: selectPalette.background,
    color: selectPalette.muted,
  }),
  singleValue: base => ({
    ...base,
    color: selectPalette.text,
    fontSize: 14,
    fontWeight: 500,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? selectPalette.optionSelected
      : state.isFocused
      ? selectPalette.optionHover
      : selectPalette.menuBackground,
    color:
      state.isSelected || state.isFocused
        ? selectPalette.optionText
        : selectPalette.optionTextMuted,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    fontSize: 14,
    fontWeight: state.isSelected ? 600 : 500,
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
