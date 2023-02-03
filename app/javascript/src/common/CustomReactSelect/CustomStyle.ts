export const customStyles = {
  control: provided => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    padding: "0",
    border: "1px solid #CDD6DF",
    "border-color": "#CDD6DF",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
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
    backgroundColor: "#FFFFFF",
  }),
  dropdownIndicator: base => ({
    ...base,
    color: "#5B34EA", // Custom colour
  }),
};

export const customErrStyles = {
  control: provided => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    padding: "0",
    border: "1px solid #E04646",
    "border-color": "E04646",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
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
    backgroundColor: "#FFFFFF",
    color: "#E04646",
  }),
  dropdownIndicator: base => ({
    ...base,
    color: "#5B34EA", // Custom colour
  }),
};
