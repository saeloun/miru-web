const Styles = {
  InvoiceDetails: {
    menu: base => ({
      ...base,
      marginTop: 0,
      borderRadius: 0,
      borderBottomLeftRadius: "8px",
      borderBottomRightRadius: "8px",
      border: 0,
      boxShadow: "none"
    }),
    placeholder: defaultStyles => ({
      ...defaultStyles,
      background: "#F5F7F9",
      padding: 5,
      paddingLeft: "5px",
      margin: 0,
      borderTopLeftRadius: "4px",
      borderBottomLeftRadius: "4px"
    }),
    valueContainer: (provided) => ({
      ...provided,
      background: "#F5F7F9",
      padding: 0,
      paddingLeft: "5px",
      margin: 0,
      borderTopLeftRadius: "4px",
      borderBottomLeftRadius: "4px"
    }),
    dropdownIndicator: base => ({
      ...base,
      background: "#F5F7F9",
      margin: 0,
      padding: 5,
      borderTopRightRadius: "4px",
      borderBottomRightRadius: "4px"
    }),
    control: (provided) => ({
      ...provided,
      boxShadow: "none",
      border: 0,
      borderRadius: 0,
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
      padding: 10,
      display: "flex"
    })
  },
  NewLineItemTable: {
    menu: base => ({
      ...base,
      marginTop: 0,
      borderRadius: 0,
      borderBottomLeftRadius: "8px",
      borderBottomRightRadius: "8px",
      border: 0,
      boxShadow: "none"
    }),
    option: (
      styles,
      { isSelected }
    ) => ({
      ...styles,
      backgroundColor: isSelected ? "#F5F7F9" : null,
      color: "#1D1A31"
    }),
    placeholder: defaultStyles => ({
      ...defaultStyles,
      padding: 0,
      paddingLeft: 2,
      margin: 0,
      borderTopLeftRadius: "4px",
      borderBottomLeftRadius: "4px"
    }),
    valueContainer: (provided) => ({
      ...provided,
      background: "#F5F7F9",
      padding: "1px",
      paddingLeft: 5,
      margin: 0,
      borderTopLeftRadius: "4px",
      borderBottomLeftRadius: "4px",
      border: "1px solid #CDD6DF",
      borderRight: "0px"
    }),
    dropdownIndicator: base => ({
      ...base,
      background: "#F5F7F9",
      margin: 0,
      padding: "5px",
      borderTopRightRadius: "4px",
      borderBottomRightRadius: "4px",
      border: "1px solid #CDD6DF",
      borderLeft: "0px"
    }),
    control: (provided) => ({
      ...provided,
      boxShadow: "none",
      border: 0,
      borderRadius: 0,
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
      padding: 10,
      display: "flex"
    })
  }
};

export default Styles;
