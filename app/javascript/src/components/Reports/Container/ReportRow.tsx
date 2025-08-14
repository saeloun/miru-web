import React from "react";

import AnimatedAvatar from "components/ui/animated-avatar";
import { minToHHMM } from "helpers";

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
    <div
      className="grid grid-cols-5 gap-2 border-b border-miru-gray-200 hover:bg-miru-gray-50 transition-colors"
      key={id}
    >
      <div>
        <div className="flex items-center py-5 text-left">
          <AnimatedAvatar
            url={clientLogo}
            name={client}
            size="md"
            animation="scale"
            className="mr-3 lg:mr-4"
          />
          <div>
            <p className="text-sm font-semibold text-miru-dark-purple-1000 lg:text-base">
              {project}
            </p>
            <p className="text-xs font-normal text-miru-dark-purple-400 lg:text-sm">
              {client}
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex h-full items-center px-6 py-5">
          <p className="text-xs font-normal text-miru-dark-purple-600 lg:text-sm">
            {note?.trim() || "—"}
          </p>
        </div>
      </div>
      <div>
        <div className="flex flex-col px-6 py-5 text-left">
          <p className="text-xs font-medium text-miru-dark-purple-1000 lg:text-sm lg:font-semibold">
            {teamMember}
          </p>
          <p className="text-xs font-normal text-miru-dark-purple-400 lg:text-sm">
            {workDate}
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-end py-5 pl-6 text-right">
          <span className="text-sm font-semibold text-miru-dark-purple-1000 lg:text-lg lg:font-bold">
            {minToHHMM(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportRow;
