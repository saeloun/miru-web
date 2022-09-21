import React from "react";

import { MagnifyingGlass } from "phosphor-react";
import { components, DropdownIndicatorProps } from "react-select";

export const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
  <components.DropdownIndicator {...props}>
    <MagnifyingGlass size={20} color="#1D1A31" />
  </components.DropdownIndicator>
);
