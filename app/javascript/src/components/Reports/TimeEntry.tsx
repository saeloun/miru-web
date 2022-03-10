import * as React from "react";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

export interface ITimeEntry {
  id: number;
  project: string;
  client: string;
  note: string;
  teamMember: string;
  workDate: string;
  duration: number;
}

export const TimeEntry = ({
  id,
  project,
  client,
  note,
  teamMember,
  workDate,
  duration
}: ITimeEntry) => {
  return (
    <tr key={id} className="flex flex-row items-center">
      <td className="w-full px-6 py-4 text-left whitespace-nowrap">
        <p className="font-semibold text-base text-miru-dark-purple-1000">
          {project}
        </p>
        <p className="font-normal text-sm text-miru-dark-purple-400">
          {client}
        </p>
      </td>
      <td className="w-full px-6 py-4 text-left whitespace-nowrap text-xs font-normal text-miru-dark-purple-1000">
        {note}
      </td>
      <td className="w-full px-6 py-4 text-left whitespace-nowrap">
        <p className="font-semibold text-base text-miru-dark-purple-1000">
          {teamMember}
        </p>
        <p className="font-normal text-sm text-miru-dark-purple-400">
          {workDate}
        </p>
      </td>
      <td className="w-full px-6 py-4 text-xl text-left whitespace-nowrap font-bold text-miru-dark-purple-1000">
        {minutesToHHMM(duration)}
      </td>
    </tr>
  );
};
