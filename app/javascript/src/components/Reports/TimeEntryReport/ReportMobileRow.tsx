import React from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import { Avatar } from "StyledComponents";

import { Divider } from "common/Divider";

import { ITimeEntry } from "../interface";

const ReportMobileRow = ({ timeEntry, clientLogo }) => {
  const {
    id,
    project,
    client,
    note,
    teamMember,
    workDate,
    duration,
  }: ITimeEntry = timeEntry;

  return (
    <div key={id}>
      <div className="grid grid-cols-10 gap-2 pt-4">
        <div className="col-span-4 flex items-start text-left">
          <div className="mr-2">
            <Avatar classNameImg="mr-0" url={clientLogo} />
          </div>
          <div className="overflow-hidden">
            <span className="truncate whitespace-normal text-sm font-semibold text-miru-dark-purple-1000">
              {project}
            </span>
            <p className="font-sans text-xs font-medium text-miru-dark-purple-400">
              {client}
            </p>
          </div>
        </div>
        <div className="col-span-4 break-normal px-2 text-left">
          <p className="mb-1 font-sans text-sm font-semibold not-italic text-miru-dark-purple-1000">
            {teamMember}
          </p>
          <p className="font-sans text-xs font-medium text-miru-dark-purple-400">
            {dayjs(workDate).format("MM.DD.YYYY")}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-end whitespace-nowrap text-right font-sans text-lg font-bold text-miru-dark-purple-1000">
          {minToHHMM(duration)}
        </div>
      </div>
      <div className="overflow-hidden pt-3 pb-4">
        <div className="h-full items-center whitespace-pre-wrap break-all font-sans text-xs font-normal text-miru-dark-purple-400">
          {note?.trim()}
        </div>
      </div>
      <Divider />
    </div>
  );
};
export default ReportMobileRow;
