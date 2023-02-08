import React from "react";

import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import { ClientsIcon } from "miruIcons";

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
  <div className="grid grid-cols-5 gap-2  border-b" key={id}>
    <div>
      <div className="flex items-center whitespace-nowrap py-2.5 pr-6 text-left">
        <div className="mr-6 md:h-10 md:w-10">
          <ClientsIcon className="m-0 object-contain" size={40} />
        </div>
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
      <div className="flex h-full items-center whitespace-pre-wrap break-words px-6 py-2.5 font-manrope text-sm font-normal text-miru-dark-purple-1000">
        {note?.trim()}
      </div>
    </div>
    <div>
      <div className="flex flex-col  break-normal px-6 py-2.5 text-left">
        <p className="mb-1 font-manrope text-base font-semibold not-italic text-miru-dark-purple-1000">
          {teamMember}
        </p>
        <p className="font-manrope text-sm font-medium text-miru-dark-purple-400">
          {dayjs(workDate).format("MM.DD.YYYY")}
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

export default ReportRow;
