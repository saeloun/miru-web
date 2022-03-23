import * as React from "react";
import { Pen, Trash } from "phosphor-react";

const TableRow = () => (
  <tr>
    <td>
      <input type="checkbox" className="" id="check1" />
    </td>
    <td className="px-6 py-5 text-left font-medium w-2/4 ftracking-wider">
      <h1 className="text-left font-semibold">Amazon</h1>
      <h3 className="text-left font-normal text-sm">78388</h3>
    </td>
    <td className="px-6 py-5 text-left font-medium w-1/4 tracking-wider">
      <h1 className="text-left font-semibold">Amazon</h1>
      <h3 className="text-left font-normal text-sm">78388</h3>
    </td>
    <td className="px-6 py-5 text-left font-bold text-xl tracking-wider">
        $1975
    </td>
    <td className="px-6 py-5 text-left font-medium tracking-wider">
      <span className="rounded-xl text-xs font-semibold px-1  bg-miru-alert-yellow-400 text-miru-alert-green-1000">
          DRAFT
      </span>
    </td>
    <td className="px-6 py-5 text-left font-medium tracking-wider">
      <button><Pen size={18} /></button>
    </td>
    <td className="text-left w-full">
      <button><Trash size={18} /></button>
    </td>
  </tr>
);

export default TableRow;
