import React, { useState } from "react";

import Select from "react-select";

const FilterSelect = ({ option, placeholder }) => {

  const [selectedOption, setSelectedOption] = useState<any>();
  return (
    <Select
      defaultValue={selectedOption}
      onChange={e => {
        setSelectedOption(e);
      }}
      options={option}
      placeholder={placeholder}
      isSearchable={true}
      className="w-40 bg-miru-gray-100 rounded text-sm font-medium"
      components={{
        IndicatorSeparator: () => null
      }}
    />
  );
};

export default FilterSelect;
