import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

const TableRow = ({ id, field, column, handleColumnChange }: Iprops) => (
  <tr className="group last:border-b-0">
    <td className="text-xs font-normal text-foreground	">{field}</td>
    <td className="w-10/12 text-xs font-normal tracking-wider text-foreground">
      <Select
        value={column[id]?.value || ""}
        onValueChange={value => {
          const selectedOption = column.find(opt => opt.value === value);
          handleColumnChange(selectedOption);
        }}
      >
        <SelectTrigger className="m-0 max-h-8 rounded border-border bg-card px-1 py-3 text-sm font-medium text-foreground">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          {column.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
