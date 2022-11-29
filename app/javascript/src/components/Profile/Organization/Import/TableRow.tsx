import React from "react";

import Select from "react-select";

import { reactSelectStyles } from "./Styles";

const TableRow = ({ id, field, column, handleColumnChange }: Iprops) => (
  <tr className="group last:border-b-0">
    <td className="text-xs font-normal text-miru-dark-purple-1000	">{field}</td>
    <td className="w-10/12 text-xs font-normal tracking-wider text-miru-dark-purple-1000">
      <Select
        bg-miru-gray-100
        className="py-3 px-1 text-white"
        classNamePrefix="m-0 font-medium text-sm rounded max-h-8 text-miru-dark-purple-1000 bg-white"
        defaultMenuIsOpen={false}
        defaultValue={column[id]}
        options={column}
        styles={reactSelectStyles.columnOptions}
        components={{
          IndicatorSeparator: () => null,
        }}
        onChange={handleColumnChange}
      />
    </td>
  </tr>
);

interface Iprops {
  id: any;
  field: any;
  column: any;
  handleColumnChange?: () => any;
}

export default TableRow;
