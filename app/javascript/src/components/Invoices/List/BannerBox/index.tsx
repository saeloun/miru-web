import * as React from "react";

const BannerBox = ({ title, value }) => (
  <li className="page-display__box">
    <p className="font-normal text-sm tracking-widest">{title}</p>
    <p className="text-5xl font-normal mt-3 tracking-widest">{value}</p>
  </li>
);

export default BannerBox;
