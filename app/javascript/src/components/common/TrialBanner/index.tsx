import React, { useState } from "react";
import { X } from "phosphor-react";
import { useNavigate } from "react-router-dom";

import { useUserContext } from "context/UserContext";
import { i18n } from "../../../i18n";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Button } from "../../ui/button";

const TrialBanner = () => {
  const { company } = useUserContext();
  const navigate = useNavigate();
  const dismissalKey = `trialBannerDismissed:${new Intl.DateTimeFormat(
    "en-CA"
  ).format(new Date())}`;

  const [dismissedFor, setDismissedFor] = useState(() =>
    localStorage.getItem(dismissalKey) ? dismissalKey : null
  );

  const trialEndsAt = company?.trial_ends_at
    ? new Date(company.trial_ends_at)
    : null;

  const hasProPlan =
    company?.plan_tier === "paid" || Boolean(company?.billing_exempt);

  const isTrialActive =
    !hasProPlan && trialEndsAt !== null && trialEndsAt.getTime() > Date.now();

  const isTrialExpired =
    !hasProPlan && trialEndsAt !== null && trialEndsAt.getTime() <= Date.now();

  if (!company || hasProPlan || (!isTrialActive && !isTrialExpired)) {
    return null;
  }

  if (isTrialExpired) {
    return (
      <Alert className="mb-4" variant="destructive">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>{i18n.t("trialBanner.trialEndedTitle")}</AlertTitle>
            <AlertDescription>
              {i18n.t("trialBanner.trialEndedDescription")}
            </AlertDescription>
          </div>
          <Button
            className="shrink-0"
            type="button"
            onClick={() => navigate("/settings/billing")}
          >
            {i18n.t("trialBanner.upgrade")}
          </Button>
        </div>
      </Alert>
    );
  }

  if (!isTrialActive || trialEndsAt === null || dismissedFor === dismissalKey) {
    return null;
  }

  const daysLeft = Math.max(
    1,
    Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)
  );

  return (
    <Alert className="mb-4">
      <div className="flex items-center justify-between gap-4">
        <AlertTitle className="mb-0">
          {daysLeft === 1
            ? i18n.t("trialBanner.daysLeftOne")
            : i18n.t("trialBanner.daysLeft", { count: daysLeft })}
        </AlertTitle>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" onClick={() => navigate("/settings/billing")}>
            {i18n.t("trialBanner.upgrade")}
          </Button>
          <Button
            aria-label={i18n.t("close")}
            className="h-8 w-8"
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => {
              localStorage.setItem(dismissalKey, "true");
              setDismissedFor(dismissalKey);
            }}
          >
            <X aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default TrialBanner;
