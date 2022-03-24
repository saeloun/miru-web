import * as React from "react";
import Table from "./Table";

const BannerBox = ({ title, value }) => (
  <li className="page-display__box">
    <p className="font-normal text-sm tracking-wider">{title}</p>
    <p className="text-5xl font-normal mt-3 tracking-wider">{value}</p>
  </li>
);

const Body = () => (
  <React.Fragment>
    <ul className="page-display__wrap">
      <BannerBox title="OVERDUE" value="$35.5k" />
      <BannerBox title="OUTSTANDING" value="$24.3k" />
      <BannerBox title="AMOUNT IN DRAFT" value="$24.5k" />
    </ul>
    <div>
      <Table/>
    </div>
  </React.Fragment>
);

export default Body;
