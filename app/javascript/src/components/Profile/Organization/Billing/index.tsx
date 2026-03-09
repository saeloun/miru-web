import React, { useEffect, useState } from "react";

import { Toastr } from "StyledComponents";
import { ApiStatus } from "constants/index";

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
      Toastr.error(
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
      Toastr.error(
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace plan and subscription in Stripe.
        </p>
      </div>

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
    </div>
  );
};

export default Billing;
