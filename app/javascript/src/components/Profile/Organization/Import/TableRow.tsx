import React, { Fragment } from "react";
import Select from "react-select";
import { reactSelectStyles } from "./Styles";

const TableRow = ({
  id,
  field,
  column,
  handleColumnChange
}) => (
  <Fragment>
    <tr className="last:border-b-0 group">
      <td className="text-xs font-normal text-miru-dark-purple-1000	">
        {field}
      </td>
      <td className="w-10/12 text-xs font-normal text-miru-dark-purple-1000 tracking-wider">
        <Select
          defaultValue={column[id]}
          onChange={handleColumnChange}
          options={column}
          className="py-3 text-white"
          classNamePrefix="m-0 font-medium text-sm rounded max-h-8 text-miru-dark-purple-1000 bg-white"
          defaultMenuIsOpen={false}
          bg-miru-gray-100
          styles={reactSelectStyles.columnOptions}
          components={{
            IndicatorSeparator: () => null
          }}
        />
      </td>
    </tr>
  </Fragment>
);

export default TableRow;
