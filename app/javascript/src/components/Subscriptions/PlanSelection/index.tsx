import React from "react";

const PlanSelection = () => {
  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="w-96 p-6 border">
        <h1>
          Plan Details
        </h1>
        <div className="flex justify-between items-center mt-6">
          <label className="text-miru-dark-purple-1000 text-xs">Number of Team Members: </label>
          <input className="w-40 bg-miru-gray-100 rounded text-right p-1" type="number" />
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;
