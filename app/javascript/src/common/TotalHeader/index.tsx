import React from "react";

const TotalHeader = ({
  firstTitle,
  firstAmount,
  secondTitle,
  secondAmount,
  thirdTitle,
  thirdAmount,
}) => (
  <div className="mt-7 px-4 lg:px-0">
    <ul className="page-display__wrap mt-1 flex flex-wrap rounded-2xl bg-miru-han-purple-1000 py-4 text-white md:flex-nowrap lg:overflow-x-auto lg:py-10">
      <li className="page-display__box w-auto flex-1 cursor-pointer pt-4 md:w-full">
        <p className="text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-widest">
          {firstTitle}
        </p>
        <p className="mt-3 text-2xl font-medium lg:text-4.5xl lg:font-semibold lg:tracking-widest">
          {firstAmount}
        </p>
      </li>
      <li className="page-display__box w-auto flex-1 cursor-pointer pt-4 md:w-full">
        <p className="text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-widest">
          {secondTitle}
        </p>
        <p className="mt-3 text-2xl font-medium md:text-4.5xl lg:font-semibold lg:tracking-widest">
          {secondAmount}
        </p>
      </li>
      <li className="page-display__box w-auto flex-1 cursor-pointer pt-4 md:w-full">
        <p className="text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-widest">
          {thirdTitle}
        </p>
        <p className="mt-3 text-2xl font-medium md:text-4.5xl lg:font-semibold lg:tracking-widest">
          {thirdAmount}
        </p>
      </li>
    </ul>
  </div>
);

export default TotalHeader;
