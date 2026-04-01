import React, { useState } from "react";

import { i18n } from "../../../i18n";

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
        <h1 className="text-base font-bold text-foreground">{i18n.t("subscriptions.planDetails")}</h1>
        <div className="mt-6 flex items-center justify-between">
          <label className="text-xs text-foreground">
            {i18n.t("subscriptions.numberOfTeamMembers")}{" "}
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
            <h6 className="text-xs text-foreground">{i18n.t("subscriptions.plan")}</h6>
            <div className="flex justify-between">
              <h5 className="text-base font-semibold text-foreground">
                {i18n.t("subscriptions.basicPlan")}
              </h5>
              <span className="text-base font-semibold text-foreground">
                {plan.details.cost}$
              </span>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                {i18n.t("subscriptions.basicPlanDescription")}
              </p>
              <span className="text-right text-xs text-muted-foreground">
                {i18n.t("subscriptions.chargedOnce")}
              </span>
            </div>
          </div>
          <div className="mb-4 border-b pb-4">
            <h6 className="text-xs text-foreground">{i18n.t("subscriptions.addOns")}</h6>
            <div className="flex justify-between">
              <h5 className="text-base font-semibold text-foreground">
                {i18n.t("subscriptions.oneTeamMember")}
              </h5>
              <span className="text-base font-semibold text-foreground">
                {plan.teammember.rate}$/mo
              </span>
            </div>
            <div className="w-half flex justify-between">
              <p className="text-xs text-muted-foreground">{i18n.t("subscriptions.basicPlanPerUser", { rate: plan.teammember.rate })}</p>
              <span className="text-right text-xs text-muted-foreground">
                {i18n.t("subscriptions.chargedEveryMonth")}
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <h5 className="text-2xl font-semibold text-foreground">{i18n.t("total")}</h5>
              <div className="text-right">
                <h5 className="text-2xl font-semibold text-foreground">
                  {total}$
                </h5>
                <span className="text-xs text-muted-foreground">
                  {i18n.t("subscriptions.plusTaxes")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button className="form__input_submit">{i18n.t("subscriptions.reviewAndPay")}</button>
      </div>
    </div>
  );
};

export default PlanSelection;
