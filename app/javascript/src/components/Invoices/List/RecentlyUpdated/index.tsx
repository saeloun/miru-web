import React from "react";

import { CustomAvatar } from "StyledComponents";

import getStatusCssClass from "utils/getStatusTag";

const RecentlyUpdated = () => (
  <div className="p-4 mx-2 w-40 h-52 border-miru-gray-200 border-2 rounded-xl text-center">
    <div className="flex justify-center whitespace-nowrap">
      <h3 className="text-xs font-normal text-miru-dark-purple-400">SA-02-045</h3>
      <h3 className="text-xs font-semibold text-miru-dark-purple-400">20.02.2020</h3>
    </div>
    <div className="flex justify-center md:my-3 my-1">
      <CustomAvatar/>
    </div>
    <h1 className="mt-1 font-semibold md:text-base text-sm tracking-wider capitalize text-miru-dark-purple-1000">Atlassian</h1>
    <h1 className="mt-2.5 mb-1 md:text-xl text-base font-bold tracking-wider text-miru-dark-purple-1000"> $8,017.00 </h1>
    <span className={getStatusCssClass("Draft") + " uppercase mt-2"}>
          Draft
    </span>
  </div>
);

export default RecentlyUpdated;
