import React from "react";

import { Divider } from "common/Divider";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import { Avatar } from "StyledComponents";

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
      <div className="flex flex-row pt-4">
        <div className="flex	w-2/5 items-center whitespace-nowrap text-left">
          <div className="w-3/10">
            <Avatar classNameImg="mr-2 lg:mr-6" url={clientLogo} />
          </div>
          <div className="overflow-hidden">
            <span className="truncate whitespace-normal text-sm font-semibold text-miru-dark-purple-1000">
              {project}
            </span>
            <p className="font-manrope text-xs font-medium text-miru-dark-purple-400">
              {client}
            </p>
          </div>
        </div>
        <div className="w-2/5	break-normal  px-2 text-left">
          <p className="mb-1 font-manrope text-sm font-semibold not-italic text-miru-dark-purple-1000">
            {teamMember}
          </p>
          <p className="font-manrope text-xs font-medium text-miru-dark-purple-400">
            {dayjs(workDate).format("MM.DD.YYYY")}
          </p>
        </div>
        <div className="flex w-1/5 items-center justify-end whitespace-nowrap text-right font-manrope text-lg font-bold text-miru-dark-purple-1000">
          {minToHHMM(duration)}
        </div>
      </div>
      <div className="flex flex-row pb-4">
        <div className="col-span-4 overflow-hidden pt-3">
          <div className="h-full items-center whitespace-pre-wrap break-all font-manrope text-xs font-normal text-miru-dark-purple-400">
            {note?.trim()}
          </div>
        </div>
      </div>
      <Divider />
    </div>
  );
};
export default ReportMobileRow;
