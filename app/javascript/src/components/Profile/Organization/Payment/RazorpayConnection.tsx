import React, { useCallback, useEffect, useState } from "react";

import { razorpayConnectionApi } from "apis/api";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Switch } from "../../../ui/switch";
import { i18n } from "../../../../i18n";

type ConnectionStatus =
  | "disconnected"
  | "pending"
  | "connected"
  | "reconnect_required"
  | "merchant_rejected"
  | "revoked"
  | "revocation_pending"
  | "reconciliation_required"
  | "recovery_pending";

interface PaymentNeedingReview {
  review_id: string;
  invoice_id: number;
  invoice_number: string;
  invoice_state: "open" | "paid" | "deleted" | "waived";
  payment_id: string | null;
  payment_link_id: string | null;
  reason: string;
  currency: string | null;
  amount: number | null;
  display_amount: string | null;
}

interface LinkNeedingConfirmation {
  invoice_id: number;
  invoice_number: string;
  reference_id: string | null;
  account_id: string | null;
  mode: string | null;
}

interface Connection {
  status: ConnectionStatus;
  account_id: string | null;
  mode: string | null;
  merchant_status: string | null;
  collections_enabled: boolean;
  collections_ready: boolean;
  collections_blocker: string | null;
  payouts_ready: boolean;
  recovery_available: boolean;
  cleanup_pending: boolean;
  payments_needing_review: PaymentNeedingReview[];
  links_needing_confirmation?: LinkNeedingConfirmation[];
}

interface ConnectionResponse {
  connection: Connection;
  connect_available: boolean;
  unavailable_reason: string | null;
  api_keys_blocked: boolean;
}

interface RazorpayConnectionProps {
  onApiKeysBlockedChange: (blocked: boolean) => void;
}

const CALLBACK_RESULTS = [
  "connected",
  "denied",
  "failed",
  "merchant_rejected",
] as const;

const CONNECTABLE_STATUSES: ConnectionStatus[] = [
  "disconnected",
  "reconnect_required",
  "merchant_rejected",
  "revoked",
];

const actionButtonClass = "h-auto w-full whitespace-normal py-2 sm:w-auto";

const text = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`paymentSettingsPage.razorpayConnection.${key}`, options);

const RazorpayConnection: React.FC<RazorpayConnectionProps> = ({
  onApiKeysBlockedChange,
}) => {
  const [details, setDetails] = useState<ConnectionResponse | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [reviewToConfirm, setReviewToConfirm] =
    useState<PaymentNeedingReview | null>(null);
  const [accountId, setAccountId] = useState("");
  const [providerReference, setProviderReference] = useState("");
  const [recoveryLinkIds, setRecoveryLinkIds] = useState<
    Record<number, string>
  >({});

  const refresh = useCallback(async () => {
    try {
      const { data } = await razorpayConnectionApi.get();
      setDetails(data);
      setAccountId(current => current || data.connection.account_id || "");
      onApiKeysBlockedChange(data.api_keys_blocked);
    } catch {
      setDetails(null);
    }
  }, [onApiKeysBlockedChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("razorpay");
    if (!result) return;

    if (
      CALLBACK_RESULTS.includes(result as (typeof CALLBACK_RESULTS)[number])
    ) {
      const message = text(`callback.${result}`);
      if (result === "connected") {
        toast.success(message);
      } else {
        toast.error(message);
      }
    }
    params.delete("razorpay");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`
    );
  }, []);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setIsWorking(true);
    try {
      await action();
      if (success) toast.success(success);
    } catch {
      // The API client already shows the server's error message.
    } finally {
      await refresh();
      setIsWorking(false);
    }
  };

  const startConnection = async () => {
    setIsWorking(true);
    try {
      const { data } = await razorpayConnectionApi.start();
      window.location.assign(data.url);
    } catch {
      await refresh();
      setIsWorking(false);
    }
  };

  const disconnect = async () => {
    setShowDisconnectDialog(false);
    setIsWorking(true);
    try {
      const { data } = await razorpayConnectionApi.disconnect();
      if (data.connection.cleanup_pending) {
        toast.warning(text("disconnectUnconfirmed"));
      } else if (data.remote_revocation_confirmed) {
        toast.success(text("disconnectConfirmed"));
      } else {
        toast.success(text("disconnected"));
      }
    } catch {
      // The API client already shows the server's error message.
    } finally {
      await refresh();
      setIsWorking(false);
    }
  };

  if (!details) return null;

  const resolveReview = () => {
    if (!reviewToConfirm) return;

    const { invoice_id: invoiceId, review_id: reviewId } = reviewToConfirm;
    setReviewToConfirm(null);
    run(() => razorpayConnectionApi.resolvePaymentReview(invoiceId, reviewId));
  };

  const reviewReferences = (payment: PaymentNeedingReview) =>
    text("reviewReferences", {
      payment: payment.payment_id || text("reviewPaymentUnknown"),
      link: payment.payment_link_id || text("reviewPaymentUnknown"),
    });

  const { connection, connect_available: connectAvailable } = details;
  const { status } = connection;
  const unconfirmedLinks = connection.links_needing_confirmation || [];
  const canConnect = connectAvailable && CONNECTABLE_STATUSES.includes(status);

  const connectButton = (
    <Button
      className={`bg-primary hover:bg-primary/90 ${actionButtonClass}`}
      disabled={isWorking}
      onClick={startConnection}
    >
      {text("connect")}
    </Button>
  );

  const disconnectButton = (label: string) => (
    <Button
      className={actionButtonClass}
      disabled={isWorking}
      variant="outline"
      onClick={() => setShowDisconnectDialog(true)}
    >
      {label}
    </Button>
  );

  return (
    <section
      aria-labelledby="razorpay-connection-title"
      className="mt-5 rounded-lg border border-border bg-background p-4"
      data-testid="razorpay-connection"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h4
          className="text-sm font-semibold text-foreground"
          id="razorpay-connection-title"
        >
          {text("title")}
        </h4>
        <Badge
          className="border-border bg-accent text-foreground"
          variant="secondary"
        >
          {text(`status.${status}`)}
        </Badge>
      </div>

      <div className="mt-2 space-y-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {!connectAvailable && status === "disconnected"
            ? text(`unavailable.${details.unavailable_reason}`)
            : text(`description.${status}`)}
        </p>

        {unconfirmedLinks.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>{text("linkConfirmationTitle")}</AlertTitle>
            <AlertDescription>
              <p>{text("linkConfirmationDescription")}</p>
              <ul className="mt-3 space-y-4">
                {unconfirmedLinks.map(link => (
                  <li className="min-w-0 space-y-2" key={link.invoice_id}>
                    <p>
                      {text("linkInvoice", { number: link.invoice_number })}
                    </p>
                    <p className="break-words text-xs">
                      {text("linkReference", {
                        reference:
                          link.reference_id || text("reviewPaymentUnknown"),
                      })}
                    </p>
                    <p className="break-words text-xs">
                      {text("linkAccount", {
                        account:
                          link.account_id || text("reviewPaymentUnknown"),
                        mode: link.mode || text("reviewPaymentUnknown"),
                      })}
                    </p>
                    <Label htmlFor={`razorpay_link_id_${link.invoice_id}`}>
                      {text("linkId")}
                    </Label>
                    <Input
                      aria-describedby={`razorpay_link_help_${link.invoice_id}`}
                      disabled={isWorking}
                      id={`razorpay_link_id_${link.invoice_id}`}
                      maxLength={86}
                      value={recoveryLinkIds[link.invoice_id] || ""}
                      onChange={event =>
                        setRecoveryLinkIds(current => ({
                          ...current,
                          [link.invoice_id]: event.target.value,
                        }))
                      }
                    />
                    <p
                      className="text-xs"
                      id={`razorpay_link_help_${link.invoice_id}`}
                    >
                      {text("linkHelp")}
                    </p>
                    <Button
                      className={actionButtonClass}
                      disabled={isWorking}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        run(
                          () =>
                            razorpayConnectionApi.recoverLinkCreation(
                              link.invoice_id,
                              recoveryLinkIds[link.invoice_id] || ""
                            ),
                          text("linkRefreshResult")
                        )
                      }
                    >
                      {text("linkRecheck")}
                    </Button>
                  </li>
                ))}
              </ul>
              {unconfirmedLinks.length >= 20 && (
                <p className="mt-2 text-xs">{text("linkConfirmationLimit")}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {connection.payments_needing_review.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>{text("reviewTitle")}</AlertTitle>
            <AlertDescription>
              <p>{text("reviewDescription")}</p>
              <ul className="mt-2 space-y-2">
                {connection.payments_needing_review.map(payment => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2"
                    key={`${payment.invoice_id}:${payment.review_id}`}
                  >
                    <div className="min-w-0 space-y-1">
                      <p>
                        {text("reviewInvoice", {
                          number: payment.invoice_number,
                          amount: payment.display_amount ?? "N/A",
                          currency: payment.currency ?? "",
                        })}
                      </p>
                      <p className="break-words text-xs">
                        {reviewReferences(payment)}
                      </p>
                      <p className="text-xs">
                        {text(`reviewState.${payment.invoice_state}`)}{" "}
                        {text(`reviewReason.${payment.reason}`, {
                          defaultValue: text("reviewReason.unknown"),
                        })}
                      </p>
                    </div>
                    <Button
                      className={actionButtonClass}
                      disabled={isWorking}
                      variant="outline"
                      onClick={() => setReviewToConfirm(payment)}
                    >
                      {text("reviewResolve")}
                    </Button>
                  </li>
                ))}
              </ul>
              {connection.payments_needing_review.length >= 20 && (
                <p className="mt-2 text-xs">{text("reviewLimit")}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {canConnect && (
          <div className="space-y-2">
            {connectButton}
            <p className="text-xs leading-5 text-muted-foreground">
              {text("hostedNote")}
            </p>
          </div>
        )}

        {status === "pending" && (
          <div className="flex flex-wrap gap-2">
            {connectAvailable && connectButton}
            {disconnectButton(text("cancelAttempt"))}
          </div>
        )}

        {status === "connected" && (
          <>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {text("account")}
                </dt>
                <dd className="break-all font-medium">
                  {connection.account_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {text("mode")}
                </dt>
                <dd className="font-medium">{connection.mode}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {text("merchantStatus")}
                </dt>
                <dd className="font-medium">
                  {text(
                    `merchant.${connection.merchant_status || "unconfirmed"}`
                  )}
                </dd>
              </div>
            </dl>

            {connection.collections_blocker && (
              <Alert>
                <AlertTitle>{text("collectionsBlockedTitle")}</AlertTitle>
                <AlertDescription>
                  {text(`blocker.${connection.collections_blocker}`, {
                    defaultValue: text("blocker.merchant_unconfirmed"),
                  })}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={connection.collections_enabled}
                disabled={isWorking || !connection.collections_ready}
                id="razorpay_connection_collections"
                onCheckedChange={enabled =>
                  run(() => razorpayConnectionApi.updateCollections(enabled))
                }
              />
              <Label
                className="text-sm font-medium"
                htmlFor="razorpay_connection_collections"
              >
                {i18n.t("paymentSettingsPage.showRazorpayOnInvoices")}
              </Label>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {text("payoutsNote")}
            </p>
            {disconnectButton(text("disconnect"))}
          </>
        )}

        {connection.cleanup_pending &&
          disconnectButton(text("retryRevocation"))}

        {(status === "reconciliation_required" ||
          (status === "revocation_pending" &&
            connection.recovery_available)) && (
          <form
            className="space-y-2"
            onSubmit={event => {
              event.preventDefault();
              run(() => razorpayConnectionApi.requestRecovery(accountId));
            }}
          >
            {status === "revocation_pending" && (
              <p className="text-sm text-muted-foreground">
                {text("recoveryOtherApplication")}
              </p>
            )}
            <Label htmlFor="razorpay_recovery_account">
              {text("recoveryAccount")}
            </Label>
            <Input
              id="razorpay_recovery_account"
              placeholder="acc_"
              value={accountId}
              onChange={event => setAccountId(event.target.value)}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {text("recoveryAccountHelp")}
            </p>
            <Button
              className={actionButtonClass}
              disabled={isWorking}
              type="submit"
              variant="outline"
            >
              {text("startRecovery")}
            </Button>
          </form>
        )}

        {status === "recovery_pending" && (
          <div className="space-y-3">
            <p className="break-all text-sm font-medium">
              {connection.account_id}
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{text("recoveryStepRevoke")}</li>
              <li>{text("recoveryStepWait")}</li>
            </ol>
            <Button
              className={actionButtonClass}
              disabled={isWorking}
              variant="outline"
              onClick={() => run(refresh)}
            >
              {text("checkAgain")}
            </Button>
            <form
              className="space-y-2 border-t border-border pt-3"
              onSubmit={event => {
                event.preventDefault();
                run(() =>
                  razorpayConnectionApi.submitRecoveryEvidence(
                    providerReference
                  )
                );
              }}
            >
              <Label htmlFor="razorpay_recovery_reference">
                {text("recoveryReference")}
              </Label>
              <Input
                id="razorpay_recovery_reference"
                value={providerReference}
                onChange={event => setProviderReference(event.target.value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {text("recoveryReferenceHelp")}
              </p>
              <Button
                className={actionButtonClass}
                disabled={isWorking || providerReference.trim().length === 0}
                type="submit"
                variant="outline"
              >
                {text("submitReference")}
              </Button>
            </form>
          </div>
        )}
      </div>

      <Dialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text("disconnectTitle")}</DialogTitle>
            <DialogDescription>
              {text("disconnectDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              {text("keepConnection")}
            </Button>
            <Button variant="destructive" onClick={disconnect}>
              {text("confirmDisconnect")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewToConfirm !== null}
        onOpenChange={open => {
          if (!open) setReviewToConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text("reviewConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {text("reviewConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          {reviewToConfirm && (
            <p className="break-all text-sm">
              {reviewReferences(reviewToConfirm)}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewToConfirm(null)}>
              {text("reviewKeep")}
            </Button>
            <Button variant="destructive" onClick={resolveReview}>
              {text("reviewConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default RazorpayConnection;
