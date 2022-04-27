import React, { useState } from "react";

const PlanSelection = () => {

  const plan = {
    details: {
      name: "Basic Plan",
      cost: 10
    },
    teammember: {
      count: 1,
      rate: 5
    }
  };

  const calculateTotal = (memberCount) => plan.details.cost + (memberCount * plan.teammember.rate);

  const [teamMemberCount, setTeamMemberCount] = useState<number>(plan.teammember.count);
  const [total, setTotal] = useState<number>(calculateTotal(plan.teammember.count));

  const handleChange = (e) => {
    setTeamMemberCount(e.target.value);
    setTotal(calculateTotal(e.target.value));
  };

  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="w-96 p-6 shadow-xl rounded bg-white">
        <h1 className="1000-miru-dark-purple-1000 font-bold text-base">
          Plan Details
        </h1>
        <div className="flex justify-between items-center mt-6">
          <label className="text-miru-dark-purple-1000 text-xs">Number of Team Members: </label>
          <input className="w-40 bg-miru-gray-100 rounded text-right p-1" onChange={handleChange} value={teamMemberCount} type="number" />
        </div>
        <div className="bg-miru-gray-100 p-4 my-6">
          <div className="border-b pb-4 mb-4">
            <h6 className="text-miru-dark-purple-1000 text-xs">Plan</h6>
            <div className="flex justify-between">
              <h5 className="text-miru-dark-purple-1000 text-base font-semibold">Basic Plan</h5>
              <span className="text-miru-dark-purple-1000 text-base font-semibold">{plan.details.cost}$</span>
            </div>
            <div className="flex justify-between">
              <p className="text-miru-dark-purple-400 text-xs">Basic plan includes all features. <br /> This is a one-time charge.</p>
              <span className="text-miru-dark-purple-400 text-xs text-right">charged once</span>
            </div>
          </div>
          <div className="border-b pb-4 mb-4">
            <h6 className="text-miru-dark-purple-1000 text-xs">Add-Ons</h6>
            <div className="flex justify-between">
              <h5 className="text-miru-dark-purple-1000 text-base font-semibold">1 team member</h5>
              <span className="text-miru-dark-purple-1000 text-base font-semibold">{plan.teammember.rate}$/mo</span>
            </div>
            <div className="flex justify-between w-half">
              <p className="text-miru-dark-purple-400 text-xs">{`Basic plan comes with additional ${plan.teammember.rate}$ per user per month.`}</p>
              <span className="text-miru-dark-purple-400 text-xs text-right">charged every month</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <h5 className="text-miru-dark-purple-1000 text-2xl font-semibold">Total</h5>
              <div className="text-right">
                <h5 className="text-miru-dark-purple-1000 text-2xl font-semibold">{total}$</h5>
                <span className="text-miru-dark-purple-400 text-xs">plus taxes</span>
              </div>
            </div>
          </div>
        </div>
        <button className="form__input_submit">
          REVIEW AND PAY
        </button>
      </div>
    </div>
  );
};

export default PlanSelection;
