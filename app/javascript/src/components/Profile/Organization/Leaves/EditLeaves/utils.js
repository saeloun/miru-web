import React from "react";

import { components } from "react-select";

const { Option } = components;

export const iconColorStyles = {
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
    width: "auto",
    zIndex: 5,
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-30%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  }),
  menuList: provided => ({
    ...provided,
    display: "grid",
    gridTemplateColumns: "auto auto auto auto",
    padding: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    display: "grid",
    justifyItems: "center",
    padding: 0,
    cursor: "pointer",
    background: state.isFocused || state.isSelected ? "#D7DEE5" : "#fff",
  }),
  "&:hover": {
    background: "#D7DEE5",
  },
};

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

export const IconOption = props => (
  <Option {...props} className="m-1 h-8 w-8 items-center">
    {props?.data?.icon}
  </Option>
);

export const ColorOption = props => (
  <Option {...props} className="h-10 w-10 items-center">
    <div className="m-3 h-4 w-4" style={{ background: props.data.value }} />
  </Option>
);
