export const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    padding: "0",
    borderColor: state.isFocused ? "#5B34EA" : "#D7DEE5",
    borderWidth: state.isFocused ? "1px" : "1px",
    boxShadow: state.isFocused && "0 0 0 1px #5B34EA",
    "&:hover": {
      borderColor: "#5B34EA",
    },
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
    zIndex: 5,
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-30%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  }),
  option: provided => ({
    ...provided,
    cursor: "pointer",
    "&:hover": {
      background: "#D7DEE5",
    },
  }),
};
