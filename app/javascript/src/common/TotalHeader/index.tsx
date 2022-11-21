import React from "react";

const TotalHeader = ({
  firstTitle,
  firstAmount,
  secondTitle,
  secondAmount,
  thirdTitle,
  thirdAmount,
}) => (
  <div className="px-10 pb-10 pt-8 mt-3 bg-miru-gray-100">
    <ul className="mt-0 border-t-0 page-display__wrap">
      <li className="page-display__box">
        <p className="text-sm font-normal tracking-widest uppercase">
          {firstTitle}
        </p>
        <p className="mt-3 text-5xl font-normal tracking-widest">
          {firstAmount}
        </p>
      </li>
      <li className="page-display__box">
        <p className="text-sm font-normal tracking-widest uppercase">
          {secondTitle}
        </p>
        <p className="mt-3 text-5xl font-normal tracking-widest">
          {secondAmount}
        </p>
      </li>
      <li className="page-display__box">
        <p className="text-sm font-normal tracking-widest uppercase">
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
