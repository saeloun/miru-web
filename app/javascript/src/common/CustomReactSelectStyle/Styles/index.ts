let focusedState = false;
let isDisabled = false;

const palette = () => {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return {
    background: dark ? "#0A0A0A" : "#FFFFFF",
    menuBackground: dark ? "#09090B" : "#FFFFFF",
    border: dark ? "#27272A" : "#CDD6DF",
    text: dark ? "#FAFAFA" : "#1D1A31",
    muted: dark ? "#A1A1AA" : "#A5A3AD",
    subtle: dark ? "#A1A1AA" : "#777683",
    optionText: dark ? "#F4F4F5" : "#1D1A31",
    optionTextMuted: dark ? "#E4E4E7" : "#52525B",
    optionHover: dark ? "#18181B" : "#F4F4F5",
    optionSelected: dark ? "#27272A" : "#E4E4E7",
  };
};

export const customStyles = (
  isDesktopView,
  ignoreDisabledFontColor = false,
  hideDropdownIndicator = false
) => ({
  control: (provided, state) => {
    const colors = palette();
    focusedState = state.isFocused;
    isDisabled = !!state.isDisabled;

    return {
      ...provided,
      backgroundColor: colors.background,
      minHeight: 48,
      padding: "0",
      border: `1px solid ${colors.border}`,
      borderColor: colors.border,
      fontWeight: 500,
    };
  },
  menu: provided => {
    const colors = palette();

    return {
      ...provided,
      fontSize: isDesktopView ? "14px" : "13px",
      letterSpacing: "normal",
      zIndex: 50,
      backgroundColor: colors.menuBackground,
      border: `1px solid ${colors.border}`,
      boxShadow: "0 12px 32px rgba(15, 23, 42, 0.18)",
      overflow: "hidden",
    };
  },
  menuList: provided => ({
    ...provided,
    backgroundColor: palette().menuBackground,
    paddingTop: 6,
    paddingBottom: 6,
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: (baseStyles, state) => ({
    ...(() => {
      const colors = palette();

      return {
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
        backgroundColor: colors.background,
        color:
          focusedState ||
          state.selectProps.inputValue ||
          (state.selectProps.value && state.selectProps.value?.value !== "")
            ? colors.subtle
            : colors.muted,
      };
    })(),
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
    ...(() => {
      const colors = palette();

      return {
        ...base,
        fontWeight: 500,
        fontSize: isDesktopView ? 16 : 14,
        color:
          isDisabled && !ignoreDisabledFontColor ? colors.muted : colors.text,
      };
    })(),
  }),
  option: (base, state) => {
    const colors = palette();

    return {
      ...base,
      backgroundColor: state.isSelected
        ? colors.optionSelected
        : state.isFocused
        ? colors.optionHover
        : colors.menuBackground,
      color:
        state.isSelected || state.isFocused
          ? colors.optionText
          : colors.optionTextMuted,
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      fontSize: isDesktopView ? 14 : 13,
      fontWeight: state.isSelected ? 600 : 500,
      lineHeight: 1.4,
      paddingTop: 10,
      paddingBottom: 10,
    };
  },
});
