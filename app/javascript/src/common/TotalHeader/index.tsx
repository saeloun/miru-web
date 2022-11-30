import React from "react";

const TotalHeader = ({
  firstTitle,
  firstAmount,
  secondTitle,
  secondAmount,
  thirdTitle,
  thirdAmount,
}) => (
  <div className="mt-3 bg-miru-gray-100 px-10 pb-10 pt-8">
    <ul className="page-display__wrap mt-0 border-t-0">
      <li className="page-display__box">
        <p className="text-sm font-normal uppercase tracking-widest">
          {firstTitle}
        </p>
        <p className="mt-3 text-5xl font-normal tracking-widest">
          {firstAmount}
        </p>
      </li>
      <li className="page-display__box">
        <p className="text-sm font-normal uppercase tracking-widest">
          {secondTitle}
        </p>
        <p className="mt-3 text-5xl font-normal tracking-widest">
          {secondAmount}
        </p>
      </li>
      <li className="page-display__box">
        <p className="text-sm font-normal uppercase tracking-widest">
          {thirdTitle}
        </p>
        <p className="mt-3 text-5xl font-normal tracking-widest">
          {thirdAmount}
        </p>
      </li>
    </ul>
  </div>
);

export default TotalHeader;
