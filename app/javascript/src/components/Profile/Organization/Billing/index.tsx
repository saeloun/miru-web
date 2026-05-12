import React, { useEffect, useState } from "react";

import {
  ApiStatus,
  MIRU_APP_SUPPORT_EMAIL,
  MIRU_APP_SUPPORT_EMAIL_ID,
} from "constants/index";
import {
  ChartLineUp,
  CheckCircle,
  ClockClockwise,
  LockKey,
  RocketLaunch,
  ShieldCheck,
  Sparkle,
  Storefront,
  TerminalWindow,
} from "phosphor-react";
import { toast } from "sonner";

import { subscriptionsApi } from "apis/api";
import { sendGAPageView } from "utils/googleAnalytics";

import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Skeleton } from "../../../ui/skeleton";
import { Slider } from "../../../ui/slider";
import { i18n } from "../../../../i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";

type BillingSummary = {
  plan_tier: string;
  plan_label: string;
  billing_exempt: boolean;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  cancel_at_period_end?: boolean;
  subscription_interval?: string | null;
  has_stripe_customer: boolean;
  team_member_limit: number;
  used_team_seats: number;
  client_portal_users_count: number;
  team_member_limit_reached: boolean;
  trial_active: boolean;
  trial_available: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  pro_access: boolean;
};

const Billing = () => {
  const [status, setStatus] = useState<ApiStatus>(ApiStatus.IDLE);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [processingTrial, setProcessingTrial] = useState(false);
  const [billingResult, setBillingResult] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [seatEstimate, setSeatEstimate] = useState(8);

  const fetchSummary = async () => {
    try {
      setStatus(ApiStatus.LOADING);
      const response = await subscriptionsApi.show();
      setSummary(response.data);
      setSeatEstimate(Math.max(response.data.used_team_seats || 3, 3));
      setStatus(ApiStatus.SUCCESS);
    } catch {
      setStatus(ApiStatus.ERROR);
    }
  };

  const startCheckout = async () => {
    try {
      setProcessingCheckout(true);
      const response = await subscriptionsApi.checkout(billingInterval);
      const checkoutUrl = response?.data?.url;
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.errors ||
          error?.message ||
          i18n.t("billingSettings.errors.unableToOpenStripeCheckout")
      );
    } finally {
      setProcessingCheckout(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      setProcessingPortal(true);
      const response = await subscriptionsApi.portal();
      const portalUrl = response?.data?.url;
      if (portalUrl) window.location.href = portalUrl;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.errors ||
          error?.message ||
          i18n.t("billingSettings.errors.unableToOpenStripeBillingPortal")
      );
    } finally {
      setProcessingPortal(false);
    }
  };

  const startTrial = async () => {
    try {
      setProcessingTrial(true);
      const response = await subscriptionsApi.trial();
      setSummary(response.data);
      toast.success(
        response?.data?.notice ||
          i18n.t("billingSettings.alerts.proTrialActive")
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.errors ||
          error?.message ||
          i18n.t("billingSettings.errors.unableToStartProTrial")
      );
    } finally {
      setProcessingTrial(false);
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchSummary();
    const query = new URLSearchParams(window.location.search);
    const billing = query.get("billing");
    if (billing) setBillingResult(billing);
  }, []);

  const planLabel = () => {
    if (!summary) return i18n.t("billingSettings.plans.unknown");

    if (summary.plan_label === "free_pro") {
      return i18n.t("billingSettings.plans.freePro");
    }

    if (summary.plan_label === "pro_trial") {
      return i18n.t("billingSettings.plans.proTrial");
    }

    if (summary.plan_label === "paid") {
      return i18n.t("billingSettings.plans.paid");
    }

    return i18n.t("billingSettings.plans.free");
  };

  const formatDate = (value?: string | null) => {
    if (!value) return null;

    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const usageLabel = summary
    ? summary.team_member_limit
      ? i18n.t("billingSettings.seatsUsed", {
          used: summary.used_team_seats,
          total: summary.team_member_limit,
        })
      : i18n.t("billingSettings.seatsUsedWithoutLimit", {
          used: summary.used_team_seats,
        })
    : "";

  const priceByInterval = {
    monthly: {
      proPerSeat: 1,
      pro: "$1/team member/mo",
      proSavings: i18n.t("billingSettings.planCadence.monthly"),
      enterprise: i18n.t("billingSettings.customAnnual"),
      hostedEnterprise: "$1,000/mo + usage",
    },
    yearly: {
      proPerSeat: 10,
      pro: "$10/team member/yr",
      proSavings: i18n.t("billingSettings.planCadence.yearlySavings"),
      enterprise: i18n.t("billingSettings.customAnnual"),
      hostedEnterprise: "$12,000/yr + usage",
    },
  } as const;

  const estimatedProSpend =
    seatEstimate * priceByInterval[billingInterval].proPerSeat;

  const monthlyEquivalent =
    billingInterval === "yearly"
      ? Math.round(estimatedProSpend / 12)
      : estimatedProSpend;

  const yearlySavings =
    seatEstimate *
    (priceByInterval.monthly.proPerSeat * 12 -
      priceByInterval.yearly.proPerSeat);

  const recommendation = (() => {
    if (seatEstimate <= 3) {
      return {
        title: i18n.t("billingSettings.recommendations.freeTitle"),
        description: i18n.t("billingSettings.recommendations.freeDescription"),
      };
    }

    if (seatEstimate <= 25) {
      return {
        title: i18n.t("billingSettings.recommendations.proTitle"),
        description: i18n.t("billingSettings.recommendations.proDescription"),
      };
    }

    return {
      title: i18n.t("billingSettings.recommendations.enterpriseTitle"),
      description: i18n.t(
        "billingSettings.recommendations.enterpriseDescription"
      ),
    };
  })();

  const pricingRows = [
    {
      feature: i18n.t("billingSettings.table.bestFor"),
      free: i18n.t("billingSettings.table.selfHostedTeams"),
      pro: i18n.t("billingSettings.table.growingServiceTeams"),
      enterprise: i18n.t("billingSettings.table.largeOrgs"),
      hostedEnterprise: i18n.t("billingSettings.table.managedTeams"),
    },
    {
      feature: i18n.t("billingSettings.table.timeTracking"),
      free: i18n.t("billingSettings.table.included"),
      pro: i18n.t("billingSettings.table.included"),
      enterprise: i18n.t("billingSettings.table.included"),
      hostedEnterprise: i18n.t("billingSettings.table.included"),
    },
    {
      feature: i18n.t("billingSettings.table.invoicesAndPayments"),
      free: i18n.t("billingSettings.table.included"),
      pro: i18n.t("billingSettings.table.included"),
      enterprise: i18n.t("billingSettings.table.included"),
      hostedEnterprise: i18n.t("billingSettings.table.included"),
    },
    {
      feature: i18n.t("billingSettings.table.reportsAndDashboards"),
      free: i18n.t("billingSettings.table.dashboardOnly"),
      pro: i18n.t("billingSettings.table.reportsAndAnalytics"),
      enterprise: i18n.t("billingSettings.table.reportsAndAnalytics"),
      hostedEnterprise: i18n.t("billingSettings.table.reportsAndAnalytics"),
    },
    {
      feature: i18n.t("billingSettings.table.sso"),
      free: i18n.t("billingSettings.table.notIncluded"),
      pro: i18n.t("billingSettings.table.included"),
      enterprise: i18n.t("billingSettings.table.included"),
      hostedEnterprise: i18n.t("billingSettings.table.included"),
    },
    {
      feature: i18n.t("billingSettings.table.auditAndAdminControls"),
      free: i18n.t("billingSettings.table.notIncluded"),
      pro: i18n.t("billingSettings.table.included"),
      enterprise: i18n.t("billingSettings.table.included"),
      hostedEnterprise: i18n.t("billingSettings.table.included"),
    },
    {
      feature: i18n.t("billingSettings.table.support"),
      free: i18n.t("billingSettings.table.community"),
      pro: i18n.t("billingSettings.table.priorityEmail"),
      enterprise: i18n.t("billingSettings.table.priorityOnboarding"),
      hostedEnterprise: i18n.t("billingSettings.table.managedOnboarding"),
    },
  ];

  const proHighlights = [
    {
      title: i18n.t("billingSettings.highlights.seatsTitle"),
      description: i18n.t("billingSettings.highlights.seatsDescription"),
      icon: <RocketLaunch size={18} weight="duotone" />,
    },
    {
      title: i18n.t("billingSettings.highlights.ssoTitle"),
      description: i18n.t("billingSettings.highlights.ssoDescription"),
      icon: <LockKey size={18} weight="duotone" />,
    },
    {
      title: i18n.t("billingSettings.highlights.financeTitle"),
      description: i18n.t("billingSettings.highlights.financeDescription"),
      icon: <ChartLineUp size={18} weight="duotone" />,
    },
  ];

  const planBullets = {
    free: [
      i18n.t("billingSettings.planBullets.free.coreProduct"),
      i18n.t("billingSettings.planBullets.free.tracking"),
      i18n.t("billingSettings.planBullets.free.dashboard"),
    ],
    pro: [
      i18n.t("billingSettings.planBullets.pro.trial"),
      i18n.t("billingSettings.planBullets.pro.sso"),
      i18n.t("billingSettings.planBullets.pro.fit"),
    ],
    enterprise: [
      i18n.t("billingSettings.planBullets.enterprise.contracts"),
      i18n.t("billingSettings.planBullets.enterprise.onboarding"),
      i18n.t("billingSettings.planBullets.enterprise.compliance"),
    ],
    hostedEnterprise: [
      i18n.t("billingSettings.planBullets.hosted.setup"),
      i18n.t("billingSettings.planBullets.hosted.operations"),
      i18n.t("billingSettings.planBullets.hosted.fit"),
    ],
  } as const;

  const isCurrentProPlan = summary?.plan_tier === "paid";
  const cadenceLabel = (
    interval: string | null | undefined,
    fallback = i18n.t("billingSettings.unknown")
  ) => {
    if (interval === "year") return i18n.t("billingSettings.yearly");

    if (interval === "month") return i18n.t("billingSettings.monthly");

    if (!interval) return fallback;

    return i18n.t("billingSettings.unknown");
  };
  const currentPlanCadenceLabel = cadenceLabel(summary?.subscription_interval);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      {billingResult === "success" && (
        <Alert>
          <AlertTitle>
            {i18n.t("billingSettings.alerts.subscriptionUpdatedTitle")}
          </AlertTitle>
          <AlertDescription>
            {i18n.t("billingSettings.alerts.subscriptionUpdated")}
          </AlertDescription>
        </Alert>
      )}

      {billingResult === "cancelled" && (
        <Alert>
          <AlertTitle>
            {i18n.t("billingSettings.alerts.checkoutCancelled")}
          </AlertTitle>
          <AlertDescription>
            {i18n.t("billingSettings.alerts.noSubscriptionChanges")}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{i18n.t("billingSettings.membership")}</CardTitle>
          {summary && <Badge variant="secondary">{planLabel()}</Badge>}
        </CardHeader>
        <CardContent>
          {status === ApiStatus.LOADING && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-9 w-32" />
            </div>
          )}

          {status === ApiStatus.ERROR && (
            <Alert variant="destructive">
              <AlertTitle>
                {i18n.t("billingSettings.alerts.unableToLoad")}
              </AlertTitle>
              <AlertDescription>
                {i18n.t("refreshPageMessage")}
              </AlertDescription>
            </Alert>
          )}

          {status === ApiStatus.SUCCESS && summary && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("billingSettings.currentPlan")}
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {planLabel()}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("billingSettings.seatUsage")}
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {usageLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("billingSettings.billingCadence")}
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {cadenceLabel(
                      summary.subscription_interval,
                      i18n.t("billingSettings.notSubscribedYet")
                    )}
                  </p>
                </div>
              </div>

              {summary.client_portal_users_count > 0 && (
                <Alert>
                  <AlertTitle>
                    {i18n.t("billingSettings.alerts.clientPortalUsersTitle")}
                  </AlertTitle>
                  <AlertDescription>
                    {i18n.t(
                      "billingSettings.alerts.clientPortalUsersDescription",
                      {
                        count: summary.client_portal_users_count,
                        total: summary.used_team_seats,
                      }
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {summary.trial_active && summary.trial_ends_at && (
                <Alert>
                  <AlertTitle>
                    {i18n.t("billingSettings.alerts.proTrialActive")}
                  </AlertTitle>
                  <AlertDescription>
                    {i18n.t("billingSettings.alerts.proTrialActiveUntil", {
                      date: formatDate(summary.trial_ends_at),
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {summary.subscription_status === "trial_expired" && (
                <Alert>
                  <AlertTitle>
                    {i18n.t("billingSettings.alerts.proTrialEnded")}
                  </AlertTitle>
                  <AlertDescription>
                    {i18n.t("billingSettings.alerts.proTrialEndedDescription")}
                  </AlertDescription>
                </Alert>
              )}

              {summary.plan_tier === "paid" &&
                summary.cancel_at_period_end &&
                summary.subscription_ends_at && (
                  <Alert>
                    <AlertTitle>
                      {i18n.t(
                        "billingSettings.alerts.subscriptionScheduledToCancel"
                      )}
                    </AlertTitle>
                    <AlertDescription>
                      {i18n.t(
                        "billingSettings.alerts.subscriptionScheduledToCancelOn",
                        {
                          date: formatDate(summary.subscription_ends_at),
                        }
                      )}
                    </AlertDescription>
                  </Alert>
                )}

              {summary.team_member_limit_reached && !summary.pro_access && (
                <Alert>
                  <AlertTitle>
                    {i18n.t("billingSettings.alerts.seatLimitReached")}
                  </AlertTitle>
                  <AlertDescription>
                    {i18n.t(
                      "billingSettings.alerts.seatLimitReachedDescription"
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex rounded-lg border border-border bg-muted p-1 shadow-sm">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      billingInterval === "monthly" ? "default" : "ghost"
                    }
                    className={
                      billingInterval === "monthly"
                        ? "shadow-sm"
                        : "text-muted-foreground"
                    }
                    onClick={() => setBillingInterval("monthly")}
                  >
                    {i18n.t("billingSettings.monthly")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={billingInterval === "yearly" ? "default" : "ghost"}
                    className={
                      billingInterval === "yearly"
                        ? "shadow-sm"
                        : "text-muted-foreground"
                    }
                    onClick={() => setBillingInterval("yearly")}
                  >
                    {i18n.t("billingSettings.yearly")}
                  </Button>
                </div>

                {summary.trial_available && (
                  <Button
                    variant="outline"
                    onClick={startTrial}
                    disabled={processingTrial}
                  >
                    {processingTrial
                      ? i18n.t("billingSettings.startingTrial")
                      : i18n.t("billingSettings.startTrial")}
                  </Button>
                )}

                {!summary.billing_exempt && summary.plan_tier !== "paid" && (
                  <Button onClick={startCheckout} disabled={processingCheckout}>
                    {processingCheckout
                      ? i18n.t("billingSettings.openingStripe")
                      : i18n.t("billingSettings.upgradeWithStripe")}
                  </Button>
                )}

                {(summary.plan_tier === "paid" ||
                  summary.has_stripe_customer) && (
                  <Button
                    variant="outline"
                    onClick={openBillingPortal}
                    disabled={processingPortal}
                  >
                    {processingPortal
                      ? i18n.t("billingSettings.openingPortal")
                      : i18n.t("billingSettings.manageBillingInStripe")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="gap-1.5 px-3 py-1">
              <Sparkle size={14} weight="fill" />
              {i18n.t("billingSettings.startTrial")}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <ClockClockwise size={14} weight="fill" />
              {i18n.t("billingSettings.saveTwoMonths")}
            </Badge>
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {i18n.t("billingSettings.heroTitle")}
          </CardTitle>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {i18n.t("billingSettings.heroDescription")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {proHighlights.map(item => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm">
                  {item.icon}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {i18n.t("billingSettings.howManySeats")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.t("billingSettings.seatEstimatorDescription")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3 text-right shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {i18n.t("billingSettings.estimatedSeats")}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {seatEstimate}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Slider
                value={[seatEstimate]}
                min={1}
                max={150}
                step={1}
                onValueChange={value => setSeatEstimate(value[0] || 1)}
                aria-label="Estimated seat count"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("billingSettings.recommended")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {recommendation.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("billingSettings.estimatedProSpend")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {billingInterval === "yearly"
                      ? `$${estimatedProSpend.toLocaleString()}/yr`
                      : `$${estimatedProSpend.toLocaleString()}/mo`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billingInterval === "yearly"
                      ? i18n.t("billingSettings.effectiveMonthlyPricing", {
                          amount: monthlyEquivalent.toLocaleString(),
                        })
                      : i18n.t("billingSettings.cancelOrUpgradeAnytime")}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("billingSettings.yearlyDiscount")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Save ${yearlySavings.toLocaleString()}/yr
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {i18n.t("billingSettings.yearlyDiscountDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  {i18n.t("billingSettings.plans.free")}
                </h3>
                <Badge variant="outline">
                  {i18n.t("billingSettings.openSource")}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">$0</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {i18n.t("billingSettings.planDescriptions.free")}
              </p>
              <div className="mt-4 space-y-2">
                {planBullets.free.map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle
                      size={16}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-foreground"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-primary/40 bg-card p-4 shadow-sm ring-1 ring-primary/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Pro</h3>
                <div className="flex items-center gap-2">
                  {billingInterval === "yearly" && (
                    <Badge variant="secondary">
                      {i18n.t("billingSettings.savePerYear", {
                        amount: yearlySavings,
                      })}
                    </Badge>
                  )}
                  <Badge>
                    {isCurrentProPlan
                      ? `${i18n.t(
                          "billingSettings.currentPlan"
                        )} (${currentPlanCadenceLabel})`
                      : i18n.t("billingSettings.recommended")}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {priceByInterval[billingInterval].pro}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {priceByInterval[billingInterval].proSavings}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {i18n.t("billingSettings.planDescriptions.pro")}
              </p>
              <div className="mt-4 space-y-2">
                {planBullets.pro.map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle
                      size={16}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {summary?.trial_available && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={startTrial}
                    disabled={processingTrial}
                  >
                    {processingTrial
                      ? i18n.t("billingSettings.startingTrial")
                      : i18n.t("billingSettings.startTrial")}
                  </Button>
                )}
                {!summary?.billing_exempt && summary?.plan_tier !== "paid" && (
                  <Button
                    className="w-full"
                    onClick={startCheckout}
                    disabled={processingCheckout}
                  >
                    {processingCheckout
                      ? i18n.t("billingSettings.openingStripe")
                      : i18n.t("billingSettings.upgradeWithStripe")}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  {i18n.t("billingSettings.noSalesCall")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  {i18n.t("billingSettings.plans.enterprise")}
                </h3>
                <Badge variant="secondary">
                  {i18n.t("billingSettings.annual")}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {priceByInterval[billingInterval].enterprise}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {i18n.t("billingSettings.planDescriptions.enterprise")}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Talk to{" "}
                <a
                  className="underline underline-offset-4"
                  href={MIRU_APP_SUPPORT_EMAIL_ID}
                >
                  {MIRU_APP_SUPPORT_EMAIL}
                </a>
              </p>
              <div className="mt-4 space-y-2">
                {planBullets.enterprise.map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <ShieldCheck
                      size={16}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-foreground"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  {i18n.t("billingSettings.plans.hostedEnterprise")}
                </h3>
                <Badge variant="outline">
                  {i18n.t("billingSettings.service")}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {priceByInterval[billingInterval].hostedEnterprise}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {i18n.t("billingSettings.planDescriptions.hostedEnterprise")}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Talk to{" "}
                <a
                  className="underline underline-offset-4"
                  href={MIRU_APP_SUPPORT_EMAIL_ID}
                >
                  {MIRU_APP_SUPPORT_EMAIL}
                </a>
              </p>
              <div className="mt-4 space-y-2">
                {planBullets.hostedEnterprise.map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Storefront
                      size={16}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-foreground"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {i18n.t("billingSettings.table.feature")}
                  </TableHead>
                  <TableHead>{i18n.t("billingSettings.plans.free")}</TableHead>
                  <TableHead>Pro</TableHead>
                  <TableHead>
                    {i18n.t("billingSettings.plans.enterprise")}
                  </TableHead>
                  <TableHead>
                    {i18n.t("billingSettings.plans.hostedEnterprise")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingRows.map(row => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium text-foreground">
                      {row.feature}
                    </TableCell>
                    <TableCell>{row.free}</TableCell>
                    <TableCell>{row.pro}</TableCell>
                    <TableCell>{row.enterprise}</TableCell>
                    <TableCell>{row.hostedEnterprise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {i18n.t("billingSettings.checkoutPoweredByStripe")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.t("billingSettings.checkoutDescription")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.t("billingSettings.linkCliDescription")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                  <ShieldCheck size={14} weight="fill" />
                  {i18n.t("billingSettings.poweredByStripe")}
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                  <TerminalWindow size={14} weight="fill" />
                  {i18n.t("billingSettings.linkCliCompatible")}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <ClockClockwise size={14} weight="fill" />
                  {i18n.t("billingSettings.changePlansAnytime")}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
