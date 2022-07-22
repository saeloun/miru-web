// NOTE: This file is for synchronous auto complete.

import React, { useState, useEffect } from "react";

import Autocomplete from "react-autocomplete";

import { MagnifyingGlass } from "phosphor-react";

const cssStyles = {
  menuStyles: {
    borderRadius: "3px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
    background: "#FFFFFF",
    padding: "5px 0",
    fontSize: "90%",
    position: "absolute",
    top: "40px",
    left: "0",
    overflow: "auto",
    maxHeight: "400px",
    border: "1px solid #ccc",
    backgroundColor: "#fff"
  },
  getDivStyles: (isHighlighted) => ({
    padding: "10px 16px",
    color: "#1D1A31",
    background: isHighlighted ? "#F5F7F9" : "white",
    display: "block"
  })
};

const SyncAutoComplete: React.FC<Iprops> = ({
  options,
  handleValue,
  defaultValue,
  size
}) => {
  const [searchValue, setValue] = useState<string>("");
  const [dropdownItems, setDropdownItems] = useState([]);

  const handleSelect = (value) => {
    const selectedItem = dropdownItems.find(item => item.value === value);
    setValue(selectedItem["label"]);
    handleValue(selectedItem["value"]);
  };

  const handleDefaultValue = () => {
    if (defaultValue["label"] && defaultValue["value"]) {
      setValue(defaultValue["label"]);
      handleValue(defaultValue["value"]);
    }
  };

  const handleEventChange = (event) => {
    setValue(event.target.value);
  };

  const handleSelectChange = (value) => {
    setValue(value);
    handleSelect(value);
  };

  useEffect(() => {
    handleDefaultValue();
  }, []);

  useEffect(() => {
    setDropdownItems(
      options.filter((item) => item["label"].toLowerCase().includes(searchValue.toLowerCase()))
    );
  }, [searchValue]);

  return (
    <div className={`${size}-auto-complete-container`}>
      <Autocomplete
        getItemValue={(item) => item["value"]}
        items={dropdownItems}
        menuStyle={cssStyles.menuStyles}
        value={searchValue}
        onChange={handleEventChange}
        onSelect={handleSelectChange}
        renderItem={(item, isHighlighted) =>
          <div style={cssStyles.getDivStyles(isHighlighted)} onClick={() => setValue(item["label"])} >
            {item.label}
          </div>
        }
        renderMenu={
          function (items, value, style) {
            if (items.length > 0) {
              return <div style={{ ...style, ...this.menuStyle }} children={items} />; //eslint-disable-line
            }
            if (items.length === 0 && searchValue === "") {
              return <></>;
            }
            return (<div style={{ ...style, ...this.menuStyle }}>
              <p style={{ padding: "8px", textAlign: "center", color: "#A5A3AD", fontSize: "20px", fontWeight: "600" }}>
                No results found.
              </p>
            </div>);
          }
        }
      />
      <button className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer">
        <MagnifyingGlass size={12} />
      </button>
    </div>
  );
};

interface Iprops {
  options: any[];
  handleValue: (value: string) => void;
  defaultValue?: object;
  size: string;
}

export default SyncAutoComplete;
