import React from "react";

import { minToHHMM } from "helpers";
import { Avatar } from "StyledComponents";

import { ITimeEntry } from "../interface";

const ReportRow = ({ timeEntry }) => {
  const {
    id,
    project,
    client,
    note,
    teamMember,
    workDate,
    duration,
    clientLogo,
  }: ITimeEntry = timeEntry;

  return (
    <div className="grid grid-cols-5 gap-2  border-b" key={id}>
      <div>
        <div className="flex items-center py-2.5 text-left">
          <Avatar classNameImg="mr-2 lg:mr-6" url={clientLogo} />
          <div>
            <p className="mb-1 whitespace-normal text-base font-semibold text-miru-dark-purple-1000">
              {project}
            </p>
            <p className="font-manrope text-sm font-medium text-miru-dark-purple-400">
              {client}
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-2 ">
        <div className="flex h-full items-center whitespace-pre-wrap break-all px-6 py-2.5 font-manrope text-sm font-normal text-miru-dark-purple-1000">
          {note?.trim()}
        </div>
      </div>
      <div>
        <div className="flex flex-col  break-normal px-6 py-2.5 text-left">
          <p className="mb-1 font-manrope text-base font-semibold not-italic text-miru-dark-purple-1000">
            {teamMember}
          </p>
          <p className="font-manrope text-sm font-medium text-miru-dark-purple-400">
            {workDate}
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-end whitespace-nowrap py-2.5 pl-6 text-right font-manrope text-xl font-bold text-miru-dark-purple-1000">
          {minToHHMM(duration)}
        </div>
      </div>
    </div>
  );
};

export default ReportRow;
