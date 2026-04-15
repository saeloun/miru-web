export const customErrStyles = isDesktopView => ({
  control: provided => ({
    ...provided,
    backgroundColor: "hsl(var(--background))",
    minHeight: 48,
    padding: "0",
    border: "1px solid hsl(var(--destructive))",
    borderColor: "hsl(var(--destructive))",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
    zIndex: 2,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--input))",
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
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--destructive))",
  }),
  dropdownIndicator: base => ({
    ...base,
    color: "#5B34EA", // Custom colour
  }),
  singleValue: base => ({
    ...base,
    fontWeight: 500,
    fontSize: isDesktopView ? 16 : 14,
    color: "hsl(var(--foreground))",
  }),
});
