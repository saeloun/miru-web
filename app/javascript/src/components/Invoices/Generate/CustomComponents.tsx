import React from "react";
import { components, DropdownIndicatorProps } from "react-select";
import { MagnifyingGlass } from "phosphor-react";

export const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
  <components.DropdownIndicator {...props}>
    <MagnifyingGlass size={20} color="#1D1A31" />
  </components.DropdownIndicator>
);

export const MultiLineButton = props => (
  <components.Control {...props}>
    {props.children}
    <button className=" mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">
        CLICK TO ADD MULTIPLE ENTRIES
    </button>
  </components.Control>
);

export const CustomOption = props => {
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
