import React from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import { ClientsIcon } from "miruIcons";

import { Divider } from "common/Divider";

import { ITimeEntry } from "../interface";

const ReportMobileRow = ({
  id,
  project,
  client,
  note,
  teamMember,
  workDate,
  duration,
}: ITimeEntry) => (
  <div key={id}>
    <div className="flex flex-row pt-2">
      <div className="flex	w-2/5 items-center whitespace-nowrap text-left">
        <div className="w-3/10">
          <ClientsIcon className="m-0 object-contain" size={32} />
        </div>
        <div className="ml-1 overflow-hidden">
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
    <div className="flex flex-row pb-2">
      <div className="col-span-4 overflow-hidden">
        <div className="h-full items-center whitespace-pre-wrap break-words font-manrope text-xs font-normal text-miru-dark-purple-1000">
          {note?.trim()}
        </div>
      </div>
    </div>
    <Divider />
  </div>
);

export default ReportMobileRow;
