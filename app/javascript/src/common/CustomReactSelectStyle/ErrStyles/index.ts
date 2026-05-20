import {
  getSelectControlStyles,
  getSelectMenuStyles,
  selectPalette,
} from "../shared";

export const customErrStyles = isDesktopView => ({
  control: (provided, state) =>
    getSelectControlStyles(provided, {
      borderColor: selectPalette.destructive,
      isFocused: state.isFocused,
      isError: true,
    }),
  menu: provided =>
    getSelectMenuStyles(provided, {
      fontSize: isDesktopView ? "14px" : "13px",
      letterSpacing: "normal",
      zIndex: 50,
    }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-40%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 9,
    backgroundColor: selectPalette.background,
    color: selectPalette.destructive,
  }),
  dropdownIndicator: base => ({
    ...base,
    color: selectPalette.muted,
  }),
  singleValue: base => ({
    ...base,
    fontWeight: 500,
    fontSize: 14,
    color: selectPalette.text,
  }),
});
