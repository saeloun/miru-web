import React from "react";

import { minToHHMM } from "helpers";

import { ITimeEntry } from "../interface";

const ReportRow = ({
  id,
  project,
  client,
  note,
  teamMember,
  workDate,
  duration,
}: ITimeEntry) => (
  <div className="grid grid-cols-5 gap-2 border-b" key={id}>
    <div className="whitespace-nowrap py-4 pr-6 text-left">
      <p className="whitespace-normal text-base font-semibold text-miru-dark-purple-1000">
        {project}
      </p>
      <p className="text-sm font-normal text-miru-dark-purple-400">{client}</p>
    </div>
    <div className="col-span-2 whitespace-pre-wrap break-words px-6 py-4 text-justify text-xs font-normal text-miru-dark-purple-1000">
      {note}
    </div>
    <div className="break-normal px-6 py-4 text-left">
      <p className="text-base font-semibold text-miru-dark-purple-1000">
        {teamMember}
      </p>
      <p className="text-sm font-normal text-miru-dark-purple-400">
        {workDate}
      </p>
    </div>
    <div className="whitespace-nowrap py-4 pl-6 text-right text-xl font-bold text-miru-dark-purple-1000">
      {minToHHMM(duration)}
    </div>
  </div>
);

export default ReportRow;
