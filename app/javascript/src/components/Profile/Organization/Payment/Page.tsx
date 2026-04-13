import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Warning as AlertCircle,
  CheckCircle as CheckCircle2,
  ArrowSquareOut as ExternalLink,
  CircleNotch as Loader2,
  Buildings as Building2,
  Shield,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert";
import { Badge } from "../../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { paymentSettings } from "apis/api";
import { ApiStatus as PaymentSettingsStatus } from "../../../../constants/index";
import { Skeleton } from "../../../ui/skeleton";
import { i18n } from "../../../../i18n";

interface OrganizationPaymentSettingsPageProps {
  onBack?: () => void;
}

const OrganizationPaymentSettingsPage: React.FC<
  OrganizationPaymentSettingsPageProps
> = ({ onBack }) => {
  const [status, setStatus] = useState<PaymentSettingsStatus>(
    PaymentSettingsStatus.IDLE
  );
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(false);
  const [showDisconnectDialog, setShowDisconnectDialog] =
    useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [accountLink, setAccountLink] = useState<string | null>(null);
  const [stripeAccountDetails, setStripeAccountDetails] = useState<any>(null);

  const fetchPaymentSettings = async () => {
    try {
      setStatus(PaymentSettingsStatus.LOADING);
      const res = await paymentSettings.get();
      setIsStripeConnected(res.data.providers.stripe.connected);
      if (res.data.providers.stripe.connected) {
        setStripeAccountDetails(res.data.providers.stripe.account_details);
      }
      setStatus(PaymentSettingsStatus.SUCCESS);
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
      setStatus(PaymentSettingsStatus.ERROR);
    }
  };

  const connectStripe = async () => {
    try {
      setIsConnecting(true);
      const res = await paymentSettings.connectStripe();
      setAccountLink(res.data.accountLink);
    } catch (error) {
      console.error("Failed to connect Stripe:", error);
      setIsConnecting(false);
    }
  };

  const disconnectStripe = async () => {
    try {
      setIsDisconnecting(true);
      await paymentSettings.disconnectStripe();
      setIsStripeConnected(false);
      setStripeAccountDetails(null);
      setShowDisconnectDialog(false);
    } catch (error) {
      console.error("Failed to disconnect Stripe:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    if (accountLink) {
      window.location.href = accountLink;
    }
  }, [accountLink]);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-32" />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onBack && (
          <div className="mb-6 flex justify-end">
            <Button variant="outline" onClick={onBack}>
              {i18n.t("paymentSettingsPage.backToSettings")}
            </Button>
          </div>
        )}
        <div className="space-y-6">
          {/* Payment Providers Section */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{i18n.t("paymentSettingsPage.title")}</CardTitle>
              </div>
              <CardDescription>
                {i18n.t("paymentSettingsPage.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === PaymentSettingsStatus.LOADING ? (
                <LoadingSkeleton />
              ) : status === PaymentSettingsStatus.ERROR ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {i18n.t("paymentSettingsPage.errorTitle")}
                  </AlertTitle>
                  <AlertDescription>
                    {i18n.t("paymentSettingsPage.errorDescription")}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Stripe Provider */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted">
                          <svg
                            className="h-7 w-7"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"
                              fill="#635BFF"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-foreground">
                            Stripe
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {i18n.t("paymentSettingsPage.stripeDescription")}
                          </p>
                          {isStripeConnected && stripeAccountDetails && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="text-sm text-muted-foreground">
                                  {i18n.t("paymentSettingsPage.connectedTo")}{" "}
                                  {stripeAccountDetails.email ||
                                    i18n.t(
                                      "paymentSettingsPage.stripeAccountFallback"
                                    )}
                                </span>
                              </div>
                              {stripeAccountDetails.charges_enabled && (
                                <Badge
                                  variant="secondary"
                                  className="border-border bg-accent text-foreground"
                                >
                                  {i18n.t("paymentSettingsPage.chargesEnabled")}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isStripeConnected ? (
                          <>
                            <Badge className="border-border bg-accent text-foreground">
                              {i18n.t("paymentSettingsPage.connected")}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDisconnectDialog(true)}
                              className="border-border text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              {i18n.t("paymentSettingsPage.disconnect")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={connectStripe}
                            disabled={isConnecting}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {i18n.t("paymentSettingsPage.connecting")}
                              </>
                            ) : (
                              <>
                                {i18n.t("paymentSettingsPage.connectStripe")}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      {i18n.t("paymentSettingsPage.featuresTitle")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {i18n.t("paymentSettingsPage.features.secureTitle")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i18n.t(
                              "paymentSettingsPage.features.secureDescription"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Building2 className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {i18n.t(
                              "paymentSettingsPage.features.currenciesTitle"
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i18n.t(
                              "paymentSettingsPage.features.currenciesDescription"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {i18n.t(
                              "paymentSettingsPage.features.methodsTitle"
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i18n.t(
                              "paymentSettingsPage.features.methodsDescription"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {i18n.t("paymentSettingsPage.features.setupTitle")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i18n.t(
                              "paymentSettingsPage.features.setupDescription"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {i18n.t("paymentSettingsPage.helpTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {i18n.t("paymentSettingsPage.helpDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="bg-card">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {i18n.t("paymentSettingsPage.viewDocumentation")}
                </Button>
                <Button variant="outline" className="bg-card">
                  {i18n.t("paymentSettingsPage.contactSupport")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {i18n.t("paymentSettingsPage.disconnectDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {i18n.t("paymentSettingsPage.disconnectDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={isDisconnecting}
            >
              {i18n.t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={disconnectStripe}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {i18n.t("paymentSettingsPage.disconnecting")}
                </>
              ) : (
                i18n.t("paymentSettingsPage.disconnect")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationPaymentSettingsPage;
