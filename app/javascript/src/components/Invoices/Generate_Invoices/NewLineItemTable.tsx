import * as React from "react";
import Select, { components, DropdownIndicatorProps } from "react-select";
import { MagnifyingGlass } from "phosphor-react";

import Styles from "./Styles";

const NewLineItemTable = ({ ShowItemInputs, setShowItemInputs, Addnew, setAddnew, selectedOption, setSelectedOption }) => {

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

  //functions
  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <MagnifyingGlass size={20} color="#1D1A31" />
    </components.DropdownIndicator>
  );

  const ManualEntryButton = props => (
    <components.MenuList {...props}>
      <button
        className="px-3 py-2 font-bold text-xs text-miru-han-purple-600 tracking-widest cursor-pointer"
        onClick={() => {
          setShowItemInputs(!ShowItemInputs);
          setAddnew(!Addnew);
        }}
      >
          ADD MANUAL ENTRY
      </button>
      {props.children}
    </components.MenuList>
  );

  const MultiLineButton = props => (
    <components.Control {...props}>
      {props.children}
      <button className=" mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">
          CLICK TO ADD MULTIPLE ENTRIES
      </button>
    </components.Control>
  );

  const CustomOption = props => {
    const { innerProps, innerRef } = props;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100"
      >
        <span className="font-medium text-base text-miru-dark-purple-1000 text-left">
          {props.data.name}
        </span>
        <span className="font-medium text-xs text-miru-dark-purple-600 text-left w-1/2">
          {props.data.description}
        </span>
        <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
          {props.data.date}
        </span>
        <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
          {props.data.total}
        </span>
      </div>
    );
  };

  return (
    <tr>
      <td colSpan={6}>
        <Select
          defaultValue={selectedOption}
          onChange={val => {
            setSelectedOption(val);
          }}
          options={options}
          placeholder="Type a name..."
          menuIsOpen={true}
          isSearchable={true}
          className="mt-5 w-full "
          classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
          defaultMenuIsOpen={true}
          styles={Styles.NewLineItemTable}
          components={{
            DropdownIndicator,
            IndicatorSeparator: () => null,
            Control: MultiLineButton,
            MenuList: ManualEntryButton,
            Option: CustomOption
          }}
        />
      </td>
    </tr>

  );
};

export default NewLineItemTable;
