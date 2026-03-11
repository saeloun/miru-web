import React, { useEffect, useState } from "react";

import { ApiStatus } from "constants/index";
import { toast } from "sonner";

import { subscriptionsApi } from "apis/api";
import { sendGAPageView } from "utils/googleAnalytics";

import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Skeleton } from "../../../ui/skeleton";
import { Slider } from "../../../ui/slider";
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
  subscription_interval?: string | null;
  has_stripe_customer: boolean;
  team_member_limit: number;
  used_team_seats: number;
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
          "Unable to open Stripe checkout"
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
          "Unable to open Stripe billing portal"
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
      toast.success(response?.data?.notice || "Your Pro trial is active");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.errors ||
          error?.message ||
          "Unable to start your Pro trial"
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
    if (!summary) return "Unknown";

    if (summary.plan_label === "free_pro") return "Free Pro";

    if (summary.plan_label === "pro_trial") return "Pro Trial";

    if (summary.plan_label === "paid") return "Paid";

    return "Free";
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
    ? `${summary.used_team_seats}/${summary.team_member_limit} seats used`
    : "";

  const cliInstallCommand =
    "curl -fsSL https://raw.githubusercontent.com/saeloun/miru-web/main/tools/miru-cli/install.sh | bash";

  const priceByInterval = {
    monthly: {
      proPerSeat: 5,
      pro: "$5/user/mo",
      proSavings: "Billed month to month",
      enterprise: "Custom annual",
      hostedEnterprise: "$1,000/mo + usage",
    },
    yearly: {
      proPerSeat: 50,
      pro: "$50/user/yr",
      proSavings: "Save 2 months per seat",
      enterprise: "Custom annual",
      hostedEnterprise: "$12,000/yr + usage",
    },
  } as const;

  const estimatedProSpend =
    seatEstimate * priceByInterval[billingInterval].proPerSeat;

  const monthlyEquivalent =
    billingInterval === "yearly"
      ? Math.round(estimatedProSpend / 12)
      : estimatedProSpend;

  const yearlySavings = seatEstimate * (5 * 12 - 50);

  const recommendation = (() => {
    if (seatEstimate <= 3) {
      return {
        title: "Stay on Free until you need controls",
        description:
          "Free works well for very small teams. Move to Pro when you need SSO, stronger reports, and more than 3 seats.",
      };
    }

    if (seatEstimate <= 25) {
      return {
        title: "Pro is the right fit",
        description:
          "For growing teams, Pro gives you SSO, finance visibility, and enough room to scale without enterprise overhead.",
      };
    }

    return {
      title: "Talk to us about Enterprise",
      description:
        "Larger teams usually need procurement support, admin controls, and a smoother rollout. Start with Pro or move straight to Enterprise.",
    };
  })();

  const pricingRows = [
    {
      feature: "Best for",
      free: "Self-hosted teams getting started",
      pro: "Growing service teams that need controls",
      enterprise: "Larger orgs with security and procurement needs",
      hostedEnterprise: "Teams that want Miru managed for them",
    },
    {
      feature: "Time tracking",
      free: "Included",
      pro: "Included",
      enterprise: "Included",
      hostedEnterprise: "Included",
    },
    {
      feature: "Invoices and payments",
      free: "Included",
      pro: "Included",
      enterprise: "Included",
      hostedEnterprise: "Included",
    },
    {
      feature: "Reports and dashboards",
      free: "Core reports",
      pro: "Advanced finance views",
      enterprise: "Advanced finance views",
      hostedEnterprise: "Advanced finance views",
    },
    {
      feature: "SSO",
      free: "Not included",
      pro: "Included",
      enterprise: "Included",
      hostedEnterprise: "Included",
    },
    {
      feature: "Audit and admin controls",
      free: "Not included",
      pro: "Included",
      enterprise: "Included",
      hostedEnterprise: "Included",
    },
    {
      feature: "Support",
      free: "Community",
      pro: "Priority email",
      enterprise: "Priority + onboarding",
      hostedEnterprise: "Managed service + onboarding",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      {billingResult === "success" && (
        <Alert>
          <AlertTitle>Subscription updated</AlertTitle>
          <AlertDescription>
            Your plan was updated in Stripe successfully.
          </AlertDescription>
        </Alert>
      )}

      {billingResult === "cancelled" && (
        <Alert>
          <AlertTitle>Checkout cancelled</AlertTitle>
          <AlertDescription>
            No changes were made to your subscription.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Membership</CardTitle>
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
              <AlertTitle>Unable to load billing details</AlertTitle>
              <AlertDescription>
                Refresh this page and try again.
              </AlertDescription>
            </Alert>
          )}

          {status === ApiStatus.SUCCESS && summary && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current plan
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {planLabel()}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Seat usage
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {usageLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Billing cadence
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {summary.subscription_interval === "year"
                      ? "Yearly"
                      : summary.subscription_interval === "month"
                      ? "Monthly"
                      : "Not subscribed yet"}
                  </p>
                </div>
              </div>

              {summary.trial_active && summary.trial_ends_at && (
                <Alert>
                  <AlertTitle>Pro trial active</AlertTitle>
                  <AlertDescription>
                    Your workspace has Pro access until{" "}
                    {formatDate(summary.trial_ends_at)}.
                  </AlertDescription>
                </Alert>
              )}

              {summary.subscription_status === "trial_expired" && (
                <Alert>
                  <AlertTitle>Pro trial ended</AlertTitle>
                  <AlertDescription>
                    Your workspace has returned to the free plan. Upgrade in
                    Stripe to restore Pro access.
                  </AlertDescription>
                </Alert>
              )}

              {summary.team_member_limit_reached && !summary.pro_access && (
                <Alert>
                  <AlertTitle>Seat limit reached</AlertTitle>
                  <AlertDescription>
                    Upgrade in Stripe to add more than 3 members to this
                    workspace.
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
                    Monthly
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
                    Yearly
                  </Button>
                </div>

                {summary.trial_available && (
                  <Button
                    variant="outline"
                    onClick={startTrial}
                    disabled={processingTrial}
                  >
                    {processingTrial
                      ? "Starting trial..."
                      : "Start 30-day Pro trial"}
                  </Button>
                )}

                {!summary.billing_exempt && summary.plan_tier !== "paid" && (
                  <Button onClick={startCheckout} disabled={processingCheckout}>
                    {processingCheckout
                      ? "Opening Stripe..."
                      : "Upgrade with Stripe"}
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
                      ? "Opening portal..."
                      : "Manage billing in Stripe"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="gap-2">
          <CardTitle>Plans</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick the cheapest plan that still gives your team enough room. Most
            growing teams should choose yearly Pro once they cross 3 seats.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  How many seats do you expect to need?
                </p>
                <p className="text-sm text-muted-foreground">
                  Use this to compare Free vs Pro and decide whether monthly or
                  yearly makes more sense.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3 text-right shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Estimated seats
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
                    Recommended
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
                    Estimated Pro spend
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {billingInterval === "yearly"
                      ? `$${estimatedProSpend.toLocaleString()}/yr`
                      : `$${estimatedProSpend.toLocaleString()}/mo`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billingInterval === "yearly"
                      ? `About $${monthlyEquivalent.toLocaleString()}/mo effective pricing`
                      : "Cancel or upgrade any time in Stripe"}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Yearly discount
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Save ${yearlySavings.toLocaleString()}/yr
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Two free months per seat compared with monthly pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Free
                </h3>
                <Badge variant="outline">Open source</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">$0</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Self-host Miru with core tracking, invoicing, reporting, and up
                to 3 team seats.
              </p>
            </div>

            <div className="rounded-xl border border-primary/40 bg-card p-4 shadow-sm ring-1 ring-primary/10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Pro</h3>
                <Badge>Recommended</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {priceByInterval[billingInterval].pro}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {priceByInterval[billingInterval].proSavings}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pro adds SSO, better reporting, more seats, and a 30-day free
                trial before you commit.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Enterprise
                </h3>
                <Badge variant="secondary">Annual</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {priceByInterval[billingInterval].enterprise}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Procurement-friendly contracts, advanced controls, and support
                for larger teams that need security review.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Hosted Enterprise
                </h3>
                <Badge variant="outline">Service</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {priceByInterval[billingInterval].hostedEnterprise}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                We host, upgrade, back up, and support Miru for you on a
                dedicated setup.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Free</TableHead>
                  <TableHead>Pro</TableHead>
                  <TableHead>Enterprise</TableHead>
                  <TableHead>Hosted Enterprise</TableHead>
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
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Miru CLI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Install the Miru CLI to use Miru from your terminal, scripts, or AI
            agents with the same permissions as your user account.
          </p>

          <div className="rounded-lg border border-border bg-muted/40 p-3 shadow-sm">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Install with mise
            </p>
            <code className="block overflow-x-auto text-sm text-foreground">
              {cliInstallCommand}
            </code>
          </div>

          <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Log in once
            </p>
            <code className="block overflow-x-auto text-sm text-foreground">
              miru login --email you@example.com --password password
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru config set-base-url --url http://127.0.0.1:9000
            </code>
          </div>

          <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Try it
            </p>
            <code className="block overflow-x-auto text-sm text-foreground">
              miru whoami
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru config show
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru version
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru upgrade
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru capabilities
            </code>
            <code className="block overflow-x-auto text-sm text-foreground">
              miru help
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru client list
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru project list
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru project list --search solar
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru expense list
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru expense create --amount 42.25 --date 2026-03-09 --category-id
              3 --description "Lunch with client"
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru invoice list
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru invoice send --id 1 --recipients client@example.com
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru payment list
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru time list --from 2026-03-01 --to 2026-03-09
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru time create --project-id 2 --duration 30 --date 2026-03-09
              --note "CLI entry"
            </code>
            <code className="mt-1 block overflow-x-auto text-sm text-foreground">
              miru time update --id 629 --project-id 2 --duration 45 --date
              2026-03-09
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
