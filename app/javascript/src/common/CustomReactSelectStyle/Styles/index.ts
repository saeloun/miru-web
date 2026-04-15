let focusedState = false;
let isDisabled = false;

const palette = {
  background: "hsl(var(--background))",
  menuBackground: "hsl(var(--popover))",
  border: "hsl(var(--input))",
  text: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  subtle: "hsl(var(--muted-foreground) / 0.9)",
  optionText: "hsl(var(--foreground))",
  optionTextMuted: "hsl(var(--foreground) / 0.8)",
  optionHover: "hsl(var(--accent))",
  optionSelected: "hsl(var(--secondary))",
};

export const customStyles = (
  isDesktopView,
  ignoreDisabledFontColor = false,
  hideDropdownIndicator = false
) => ({
  control: (provided, state) => {
    focusedState = state.isFocused;
    isDisabled = !!state.isDisabled;

    return {
      ...provided,
      backgroundColor: palette.background,
      minHeight: 48,
      padding: "0",
      border: `1px solid ${palette.border}`,
      borderColor: palette.border,
      fontWeight: 500,
    };
  },
  menu: provided => ({
    ...provided,
    fontSize: isDesktopView ? "14px" : "13px",
    letterSpacing: "normal",
    zIndex: 50,
    backgroundColor: palette.menuBackground,
    border: `1px solid ${palette.border}`,
    boxShadow: "0 12px 32px hsl(var(--foreground) / 0.18)",
    overflow: "hidden",
  }),
  menuList: provided => ({
    ...provided,
    backgroundColor: palette.menuBackground,
    paddingTop: 6,
    paddingBottom: 6,
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
    backgroundColor: palette.background,
    color:
      focusedState ||
      state.selectProps.inputValue ||
      (state.selectProps.value && state.selectProps.value?.value !== "")
        ? palette.subtle
        : palette.muted,
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
    color:
      isDisabled && !ignoreDisabledFontColor ? palette.muted : palette.text,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? palette.optionSelected
      : state.isFocused
      ? palette.optionHover
      : palette.menuBackground,
    color:
      state.isSelected || state.isFocused
        ? palette.optionText
        : palette.optionTextMuted,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    fontSize: isDesktopView ? 14 : 13,
    fontWeight: state.isSelected ? 600 : 500,
    lineHeight: 1.4,
    paddingTop: 10,
    paddingBottom: 10,
  }),
});
