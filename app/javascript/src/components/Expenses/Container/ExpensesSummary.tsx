import React from "react";

import { Doughnut } from "react-chartjs-2";

const ExpensesSummary = () => {
  const data = {
    labels: [
      "Food",
      "Salary",
      "Furniture",
      "Repairs & Maintenance",
      "Travel",
      "Health insurance",
      "Rent",
      "Tax",
      "Other",
    ],
    datasets: [
      {
        label: "Expenses",
        data: [2000, 5678, 9226, 21572, 298, 7282, 78272, 26272, 8464],
      },
    ],
  };

  return (
    <div className="flex w-full flex-col flex-wrap items-center bg-miru-gray-100 px-8 md:flex-row md:py-4 md:px-16 lg:py-6 lg:px-20">
      <div className="p-5">
        <Doughnut data={data} />
      </div>
      {/* <div className="flex w-full flex-wrap">
        {data.labels.map(label => (
          <span className="w-1/2 py-4 md:w-1/3 md:py-6">{label}</span>
        ))}
      </div> */}
    </div>
  );
};

export default ExpensesSummary;
