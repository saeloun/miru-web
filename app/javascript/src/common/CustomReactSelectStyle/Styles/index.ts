let focusedState = false;
let isDisabled = false;

export const customStyles = (isDesktopView, ignoreDisabledFontColor) => ({
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
        : "20%",
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
