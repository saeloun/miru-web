export const customStyles = {
  placeholder: defaultStyles => ({
    ...defaultStyles,
    background: "#F5F7F9",
    color: "#A5A3AD",
  }),
  menu: base => ({
    ...base,
    marginTop: 0,
    marginBottom: 0,
    border: "none",
    boxShadow: "none",
    backgroundColor: "white",
    position: "relative",
    zIndex: 3,
  }),
  control: provided => ({
    ...provided,
    border: 0,
    background: "#F5F7F9",
    boxShadow: "none",
  }),
  option: (styles, { isSelected }) => ({
    ...styles,
    backgroundColor: isSelected ? "#F5F7F9" : null,
    "&:hover": {
      backgroundColor: "#F5F7F9",
    },
  }),
};
