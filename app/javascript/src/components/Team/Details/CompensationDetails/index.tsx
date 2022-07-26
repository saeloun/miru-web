import React, { Fragment } from "react";
import StaticPage from "./StaticPage";

const CompensationDetails = () => (
  <Fragment>
    <div className="px-10 py-4 bg-miru-han-purple-1000 flex items-center justify-between">
      <h1 className="text-white font-bold text-2xl">Compensation Details</h1>
    </div>
    <StaticPage />
  </Fragment>
);

export default CompensationDetails;
