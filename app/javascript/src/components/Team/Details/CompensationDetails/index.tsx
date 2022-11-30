import React, { Fragment } from "react";

import StaticPage from "./StaticPage";

const CompensationDetails = () => (
  <Fragment>
    <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
      <h1 className="text-2xl font-bold text-white">Compensation Details</h1>
    </div>
    <StaticPage />
  </Fragment>
);

export default CompensationDetails;
