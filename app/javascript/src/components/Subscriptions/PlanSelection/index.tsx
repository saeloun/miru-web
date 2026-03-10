import React, { useState } from "react";

const PlanSelection = () => {
  const plan = {
    details: {
      name: "Basic Plan",
      cost: 10,
    },
    teammember: {
      count: 1,
      rate: 5,
    },
  };

  const calculateTotal = memberCount =>
    plan.details.cost + memberCount * plan.teammember.rate;

  const [teamMemberCount, setTeamMemberCount] = useState<number>(
    plan.teammember.count
  );

  const [total, setTotal] = useState<number>(
    calculateTotal(plan.teammember.count)
  );

  const handleChange = e => {
    setTeamMemberCount(e.target.value);
    setTotal(calculateTotal(e.target.value));
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 rounded bg-white p-6 shadow-xl">
        <h1 className="text-base font-bold text-foreground">Plan Details</h1>
        <div className="mt-6 flex items-center justify-between">
          <label className="text-xs text-foreground">
            Number of Team Members:{" "}
          </label>
          <input
            className="w-40 rounded bg-muted p-1 text-right"
            type="number"
            value={teamMemberCount}
            onChange={handleChange}
          />
        </div>
        <div className="my-6 bg-muted p-4">
          <div className="mb-4 border-b pb-4">
            <h6 className="text-xs text-foreground">Plan</h6>
            <div className="flex justify-between">
              <h5 className="text-base font-semibold text-foreground">
                Basic Plan
              </h5>
              <span className="text-base font-semibold text-foreground">
                {plan.details.cost}$
              </span>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                Basic plan includes all features. <br /> This is a one-time
                charge.
              </p>
              <span className="text-right text-xs text-muted-foreground">
                charged once
              </span>
            </div>
          </div>
          <div className="mb-4 border-b pb-4">
            <h6 className="text-xs text-foreground">Add-Ons</h6>
            <div className="flex justify-between">
              <h5 className="text-base font-semibold text-foreground">
                1 team member
              </h5>
              <span className="text-base font-semibold text-foreground">
                {plan.teammember.rate}$/mo
              </span>
            </div>
            <div className="w-half flex justify-between">
              <p className="text-xs text-muted-foreground">{`Basic plan comes with additional ${plan.teammember.rate}$ per user per month.`}</p>
              <span className="text-right text-xs text-muted-foreground">
                charged every month
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <h5 className="text-2xl font-semibold text-foreground">Total</h5>
              <div className="text-right">
                <h5 className="text-2xl font-semibold text-foreground">
                  {total}$
                </h5>
                <span className="text-xs text-muted-foreground">
                  plus taxes
                </span>
              </div>
            </div>
          </div>
        </div>
        <button className="form__input_submit">REVIEW AND PAY</button>
      </div>
    </div>
  );
};

export default PlanSelection;
