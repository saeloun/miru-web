import React from "react";

import { Categories } from "../../utils";

const ExpensesSummary = () => (
  <div className="flex w-full flex-wrap bg-miru-gray-100 px-4 py-10 lg:py-6 lg:px-20">
    <div className="grid w-full grid-cols-2 flex-wrap gap-10 lg:grid-cols-3 lg:grid-rows-3">
      {Categories?.map(category => (
        <div
          className="flex w-1/3 items-center justify-start"
          key={category.value}
        >
          <div
            className="mr-2 flex h-6 w-6 items-center justify-center rounded-full p-1"
            style={{
              backgroundColor: category.color,
              color: category.iconColor,
            }}
          >
            {category.icon}
          </div>
          <div className="flex flex-col items-start justify-start">
            <span className="text-base font-normal text-miru-dark-purple-600">
              {category.label}
            </span>
            <span className="text-base font-bold text-miru-dark-purple-600">
              {category.color}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ExpensesSummary;
