import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

const FilterSelect = ({ option, placeholder }) => {
  const [selectedOption, setSelectedOption] = useState<any>();

  return (
    <Select
      value={selectedOption?.value || ""}
      onValueChange={value => {
        const selected = option.find(opt => opt.value === value);
        setSelectedOption(selected);
      }}
    >
      <SelectTrigger className="w-40 rounded bg-miru-gray-100 text-sm font-medium">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {option.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default FilterSelect;
