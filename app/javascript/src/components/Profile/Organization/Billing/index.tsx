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

type BillingSummary = {
  plan_tier: string;
  billing_exempt: boolean;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  has_stripe_customer: boolean;
  team_member_limit: number;
  used_team_seats: number;
  team_member_limit_reached: boolean;
};

const Billing = () => {
  const [status, setStatus] = useState<ApiStatus>(ApiStatus.IDLE);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [billingResult, setBillingResult] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setStatus(ApiStatus.LOADING);
      const response = await subscriptionsApi.show();
      setSummary(response.data);
      setStatus(ApiStatus.SUCCESS);
    } catch {
      setStatus(ApiStatus.ERROR);
    }
  };

  const startCheckout = async () => {
    try {
      setProcessingCheckout(true);
      const response = await subscriptionsApi.checkout();
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

  useEffect(() => {
    sendGAPageView();
    fetchSummary();
    const query = new URLSearchParams(window.location.search);
    const billing = query.get("billing");
    if (billing) setBillingResult(billing);
  }, []);

  const planLabel = () => {
    if (!summary) return "Unknown";

    if (summary.billing_exempt) return "Free Pro";

    if (summary.plan_tier === "paid") return "Paid";

    return "Free";
  };

  const usageLabel = summary
    ? `${summary.used_team_seats}/${summary.team_member_limit} seats used`
    : "";

  const cliInstallCommand =
    "curl -fsSL https://raw.githubusercontent.com/saeloun/miru-web/main/tools/miru-cli/install.sh | bash";

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

      <Card>
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
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current plan
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {planLabel()}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Seat usage
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {usageLabel}
                  </p>
                </div>
              </div>

              {summary.team_member_limit_reached &&
                summary.plan_tier !== "paid" && (
                  <Alert>
                    <AlertTitle>Seat limit reached</AlertTitle>
                    <AlertDescription>
                      Upgrade in Stripe to add more than 3 members to this
                      workspace.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="flex flex-wrap gap-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Miru CLI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Install the Miru CLI to use Miru from your terminal, scripts, or AI
            agents with the same permissions as your user account.
          </p>

          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Install with mise
            </p>
            <code className="block overflow-x-auto text-sm text-foreground">
              {cliInstallCommand}
            </code>
          </div>

          <div className="rounded-md border p-3">
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

          <div className="rounded-md border p-3">
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
