export const reactSelectStyles = {
  InvoiceDetails: {
    menu: base => ({
      ...base,
      marginTop: 0,
      borderRadius: 0,
      borderBottomLeftRadius: "8px",
      borderBottomRightRadius: "8px",
      border: 0,
      boxShadow: "0px 20px 20px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.1)"
    }),
    placeholder: defaultStyles => ({
      ...defaultStyles,
      background: "#F5F7F9",
      paddingLeft: "5px",
      margin: 0,
      borderTopLeftRadius: "4px",
      borderBottomLeftRadius: "4px"
    }),
    valueContainer: (provided) => ({
      ...provided,
      background: "#F5F7F9",
      paddingLeft: "5px",
      margin: 0,
      borderTopLeftRadius: "4px",
      borderBottomLeftRadius: "4px"
    }),
    dropdownIndicator: base => ({
      ...base,
      background: "#F5F7F9",
      margin: 0,
      padding: "6px",
      paddingTop: "7px",
      borderTopRightRadius: "4px",
      borderBottomRightRadius: "4px"
    }),
    control: (provided) => ({
      ...provided,
      boxShadow: "0px 0px 40px rgba(0,0,0,0.1)",
      border: 0,
      borderRadius: 0,
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
      padding: 10,
      display: "flex"
    }),
    option: (
      styles,{ isSelected }
    ) => ({
      ...styles,
      backgroundColor: isSelected ? "#F5F7F9":null,
      "&:hover": {
        backgroundColor: "#F5F7F9"
      }
    })
  }
};
