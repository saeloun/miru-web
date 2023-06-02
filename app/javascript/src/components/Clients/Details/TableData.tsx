import React from "react";

import { minToHHMM } from "helpers";

const TableData = (projects, isDesktop) => {
  if (projects && isDesktop) {
    return projects.map(project => ({
      col1: (
        <div className="text-base capitalize text-miru-dark-purple-1000">
          apple
        </div>
      ),
      col2: (
        <div className="text-sm font-medium text-miru-dark-purple-1000">
          {project.team.map((member, index) => (
            <span key={index}>{member},&nbsp;</span>
          ))}
        </div>
      ),
      col3: (
        <div className="text-right text-lg font-bold text-miru-dark-purple-1000">
          {minToHHMM(project.minutes)}
        </div>
      ),
      rowId: project.id,
    }));
  } else if (projects && !isDesktop) {
    return projects.map(project => ({
      col1: (
        <div className="text-base font-medium capitalize text-miru-dark-purple-1000">
          {project.name}
          <br />
          <div className="w-57.5">
            {project.team.map((member, index) => (
              <span
                className="font-manrope text-xs text-miru-dark-purple-400"
                key={index}
              >
                {member},&nbsp;
              </span>
            ))}
          </div>
        </div>
      ),
      col2: (
        <div className="mr-4 text-right text-lg font-bold text-miru-dark-purple-1000">
          {minToHHMM(project.minutes)}
        </div>
      ),
      rowId: project.id,
    }));
  }

  return [{}];
};

export default TableData;
