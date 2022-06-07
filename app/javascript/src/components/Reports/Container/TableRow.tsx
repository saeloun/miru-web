import React from "react";
import { minutesToHHMM } from "../../../helpers/hhmm-parser";
import { ITimeEntry } from "../interface";

const TableRow = ({
  id,
  project,
  client,
  note,
  teamMember,
  workDate,
  duration
}: ITimeEntry) => (

  <tr key={id} className="flex flex-row items-center">
    <td className="w-1/5 px-6 py-4 text-left whitespace-nowrap">
      <p className="font-semibold text-base text-miru-dark-purple-1000">
        {project}
      </p>
      <p className="font-normal text-sm text-miru-dark-purple-400">
        {client}
      </p>
    </td>
    <td className="w-3/5 px-6 py-4 text-left text-xs font-normal text-miru-dark-purple-1000 whitespace-pre-wrap">
      {note}
    </td>
    <td className="w-1/5 px-6 py-4 text-left whitespace-nowrap">
      <p className="font-semibold text-base text-miru-dark-purple-1000">
        {teamMember}
      </p>
      <p className="font-normal text-sm text-miru-dark-purple-400">
        {workDate}
      </p>
    </td>
    <td className="w-1/5 px-6 py-4 text-xl text-right whitespace-nowrap font-bold text-miru-dark-purple-1000">
      {minutesToHHMM(duration)}
    </td>
  </tr>
);

export default TableRow;
