import React from "react";

import { minToHHMM } from "helpers";

const TableData = (project, currencySymb) => {
  if (project) {
    return project.members.map(member => ({
      col1: <div className="text-base text-foreground">{member.name}</div>,
      col2: (
        <div className="text-right text-base text-foreground">
          {currencySymb}
          {member.hourlyRate}
        </div>
      ),
      col3: (
        <div className="text-right text-base text-foreground">
          {minToHHMM(member.minutes)}
        </div>
      ),
      col4: (
        <div className="text-right text-lg font-bold text-foreground">
          {currencySymb}
          {Number(member.cost).toFixed(2)}
        </div>
      ),
    }));
  }
};

export default TableData;
