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
    <ul className="page-display__wrap mt-1 flex flex-wrap rounded-2xl bg-primary py-4 text-white md:flex-nowrap lg:overflow-x-auto lg:py-10">
      <li className="page-display__box cursor-pointer pr-2 pt-4 xsm:flex-1 xsm:pr-6 md:w-full">
        <p className="text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-wider">
          {firstTitle}
        </p>
        <p className="mt-3 text-2xl font-medium tracking-tight lg:text-3xl lg:font-semibold lg:tracking-wide">
          {firstAmount}
        </p>
      </li>
      <li className="page-display__box cursor-pointerpr-2 pt-4 xsm:flex-1 xsm:pr-6 md:w-full">
        <p className="text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-wider">
          {secondTitle}
        </p>
        <p className="mt-3 text-2xl font-medium tracking-tight md:text-3xl lg:font-semibold lg:tracking-wide">
          {secondAmount}
        </p>
      </li>
      <li className="page-display__box cursor-pointer pr-2 pt-4 xsm:flex-1 xsm:pr-6 md:w-full">
        <p className="text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-wider">
          {thirdTitle}
        </p>
        <p className="mt-3 text-2xl font-medium tracking-tight md:text-3xl lg:font-semibold lg:tracking-wide">
          {thirdAmount}
        </p>
      </li>
    </ul>
  </div>
);

export default TotalHeader;
