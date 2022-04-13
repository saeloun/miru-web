import React from "react";
import Select, { components } from "react-select";

import { DropdownIndicator, CustomOption } from "./CustomComponents";
import { reactSelectStyles } from "./Styles";

const NewLineItemTable = ({ showItemInputs, setShowItemInputs, addNew, setAddNew, selectedOption, setSelectedOption, setShowMultilineModal }) => {

  const options = [
    {
      value: "Jake",
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    },
    {
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    },
    {
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    },
    {
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    }
  ];

  const multipleEntryButton = props => (
    <components.Control {...props}>
      {props.children}
      <button
        onClick={() => {
          setAddNew(!addNew);
          setShowMultilineModal(true);
        }}
        className=" mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">
        CLICK TO ADD MULTIPLE ENTRIES
      </button>
    </components.Control>
  );

  const manualEntryButton = props => (
    <components.MenuList {...props}>
      <button
        className="px-3 py-2 font-bold text-xs text-miru-han-purple-600 tracking-widest cursor-pointer"
        onClick={() => {
          setShowItemInputs(!showItemInputs);
          setAddNew(!addNew);
        }}
      >
        ADD MANUAL ENTRY
      </button>
      {props.children}
    </components.MenuList>
  );

  return (
    <tr>
      <td colSpan={6}>
        <Select
          defaultValue={selectedOption}
          onChange={e => {
            setSelectedOption(e);
          }}
          options={options}
          placeholder="Type a name..."
          menuIsOpen={true}
          isSearchable={true}
          className="mt-5 w-full"
          classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
          defaultMenuIsOpen={true}
          styles={reactSelectStyles.NewLineItemTable}
          components={{
            DropdownIndicator,
            IndicatorSeparator: () => null,
            Control: multipleEntryButton,
            MenuList: manualEntryButton,
            Option: CustomOption
          }}
        />
      </td>
    </tr>

  );
};

export default NewLineItemTable;
