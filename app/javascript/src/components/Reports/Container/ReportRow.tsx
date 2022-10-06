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
  duration
}: ITimeEntry) => (

  <div key={id} className="grid grid-cols-5 gap-2 border-b">
    <div className="pr-6 py-4 text-left whitespace-nowrap">
      <p className="font-semibold whitespace-normal text-base text-miru-dark-purple-1000">
        {project}
      </p>
      <p className="font-normal text-sm text-miru-dark-purple-400">
        {client}
      </p>
    </div>
    <div className="col-span-2 px-6 py-4 text-xs font-normal text-miru-dark-purple-1000 whitespace-pre-wrap break-words text-justify">
      {note}
    </div>
    <div className="px-6 py-4 text-left break-normal">
      <p className="font-semibold text-base text-miru-dark-purple-1000">
        {teamMember}
      </p>
      <p className="font-normal text-sm text-miru-dark-purple-400">
        {workDate}
      </p>
    </div>
    <div className="pl-6 py-4 text-xl text-right whitespace-nowrap font-bold text-miru-dark-purple-1000">
      {minToHHMM(duration)}
    </div>
  </div>
);

export default ReportRow;
