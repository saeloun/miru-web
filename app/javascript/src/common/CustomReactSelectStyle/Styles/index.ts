let focusedState = false;
let isDisabled = false;

<<<<<<< HEAD
export const customStyles = (
  isDesktopView,
  ignoreDisabledFontColor = false,
  hideDropdownIndicator = false
) => ({
=======
export const customStyles = (isDesktopView, hideDropdownIndicator = false) => ({
>>>>>>> 24797d5f (Add default value for hideDropdownIndicator and fix minor UI issues)
  control: (provided, state) => {
    focusedState = state.isFocused;
    isDisabled = !!state.isDisabled;

    return {
      ...provided,
      backgroundColor: "#FFFFFF",
      minHeight: 48,
      padding: "0",
      border: "1px solid #CDD6DF",
      "border-color": "#CDD6DF",
      fontWight: 500,
    };
  },
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
    zIndex: 2,
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: (baseStyles, state) => ({
    ...baseStyles,
    position: "absolute",
    top:
      focusedState ||
      state.selectProps.inputValue ||
      (state.selectProps.value && state.selectProps.value?.value !== "")
        ? "-40%"
        : "15%",
    transition: "top 0.5s",
    fontSize:
      focusedState ||
      state.selectProps.inputValue ||
      (state.selectProps.value && state.selectProps.value?.value !== "")
        ? 9
        : isDesktopView
        ? 16
        : 14,
    backgroundColor: "#FFFFFF",
    color:
      focusedState ||
      state.selectProps.inputValue ||
      (state.selectProps.value && state.selectProps.value?.value !== "")
        ? "#777683"
        : "#A5A3AD",
  }),
  dropdownIndicator: base => ({
    ...base,
    color: "#5B34EA", // Custom colour
    display: hideDropdownIndicator ? "none" : "block",
  }),
  input: base => ({
    ...base,
    '[type="text"]': {
      fontWeight: "500 !important",
    },
  }),
  singleValue: base => ({
    ...base,
    fontWeight: 500,
    fontSize: isDesktopView ? 16 : 14,
    color: isDisabled && !ignoreDisabledFontColor ? "#A5A3AD" : "#1D1A31",
  }),
});
