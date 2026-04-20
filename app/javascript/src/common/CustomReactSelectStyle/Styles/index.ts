import {
  getSelectControlStyles,
  getSelectMenuStyles,
  selectPalette,
} from "../shared";

export const customStyles = (
  isDesktopView,
  ignoreDisabledFontColor = false,
  hideDropdownIndicator = false
) => ({
  control: (provided, state) =>
    getSelectControlStyles(provided, {
      borderColor: state.isFocused ? selectPalette.focus : selectPalette.border,
      isFocused: state.isFocused,
    }),
  menu: provided =>
    getSelectMenuStyles(provided, {
      fontSize: isDesktopView ? "14px" : "13px",
    }),
  menuList: provided => ({
    ...provided,
    backgroundColor: selectPalette.menuBackground,
    paddingTop: 6,
    paddingBottom: 6,
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: (baseStyles, state) => {
    const hasValue = Boolean(state.selectProps.value?.value);
    const hasInput = Boolean(state.selectProps.inputValue);
    const isFloating = state.isFocused || hasInput || hasValue;

    return {
      ...baseStyles,
      position: "absolute",
      top: isFloating ? "-40%" : "15%",
      transition: "top 0.5s",
      fontSize: isFloating ? 9 : isDesktopView ? 16 : 14,
      backgroundColor: selectPalette.background,
      color: isFloating ? selectPalette.subtle : selectPalette.muted,
    };
  },
  dropdownIndicator: base => ({
    ...base,
    color: selectPalette.muted,
    display: hideDropdownIndicator ? "none" : "block",
  }),
  input: base => ({
    ...base,
    '[type="text"]': {
      fontWeight: "500 !important",
    },
  }),
  singleValue: (base, state) => ({
    ...base,
    fontWeight: 500,
    fontSize: isDesktopView ? 16 : 14,
    color:
      state.isDisabled && !ignoreDisabledFontColor
        ? selectPalette.muted
        : selectPalette.text,
  }),
  option: (base, state) => ({
    ...base,
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
    fontSize: isDesktopView ? 14 : 13,
    fontWeight: state.isSelected ? 600 : 500,
    lineHeight: 1.4,
    paddingTop: 10,
    paddingBottom: 10,
  }),
});
