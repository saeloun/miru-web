import React, { useState } from "react";

import { MultiSelect } from "react-multi-select-component";

const MultiSelectWithSearch = ({ options, filters, setFilters, field }) => {
  const [selected, setSelected] = useState(filters[field]);

  const handleChange = (selectedOptions) => {
    setSelected(selectedOptions);
    setFilters({ ...filters, [field]: selectedOptions });
  };

  const customValueRenderer = (selected) =>
    selected.length && selected.length == options.length
      ? "All options selected"
      : `${selected.length} option(s) selected`;

  const ItemRenderer = ({ checked, option, onClick, disabled }) => (
    <div
      id="customCheckBox"
      className={`item-renderer ${disabled ? "disabled" : ""}`}
    >
      <input
        type="checkbox"
        onChange={onClick}
        checked={checked}
        tabIndex={-1}
        disabled={disabled}
        className="checked:bg-miru-han-purple-1000"
      />
      <span>{option.label}</span>
    </div>
  );

  return (
    <MultiSelect
      className="w-9/12"
      valueRenderer={customValueRenderer}
      options={options}
      value={selected}
      onChange={handleChange}
      labelledBy={"Select"}
      ItemRenderer={ItemRenderer}
    />
  );
};

export default MultiSelectWithSearch;
