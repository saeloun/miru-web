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
  QrCode,
  Copy,
  DeviceMobile,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Switch } from "../../../ui/switch";
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
import { MiruLogoWithTextSVG } from "miruIcons";
import { toast } from "sonner";

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
  const [isSavingUpi, setIsSavingUpi] = useState<boolean>(false);
  const [isSavingRazorpay, setIsSavingRazorpay] = useState<boolean>(false);
  const [accountLink, setAccountLink] = useState<string | null>(null);
  const [stripeAccountDetails, setStripeAccountDetails] = useState<any>(null);
  const [upiSettings, setUpiSettings] = useState({
    enabled: false,
    enabledOnInvoices: true,
    upiId: "",
    payeeName: "",
    merchantCategoryCode: "",
    paymentLink: "",
    qrCodeSvg: "",
    qrCodeDataUri: "",
  });

  const [razorpaySettings, setRazorpaySettings] = useState({
    enabled: false,
    enabledOnInvoices: true,
    keyId: "",
    keySecret: "",
    keySecretConfigured: false,
    webhookSecret: "",
    webhookSecretConfigured: false,
    linkedAccountId: "",
    platformFeePercent: "5",
    routeTransfersEnabled: false,
    payoutsEnabled: false,
    payoutAccountNumber: "",
    payoutUpiId: "",
    payoutPurpose: "payout",
    payoutQueueIfLowBalance: false,
  });

  const fetchPaymentSettings = async () => {
    try {
      setStatus(PaymentSettingsStatus.LOADING);
      const res = await paymentSettings.get();
      setIsStripeConnected(res.data.providers.stripe.connected);
      if (res.data.providers.stripe.connected) {
        setStripeAccountDetails(res.data.providers.stripe.account_details);
      }
      const upi = res.data.providers.upi;
      if (upi) {
        setUpiSettings({
          enabled: !!upi.enabled,
          enabledOnInvoices: upi.enabledOnInvoices ?? true,
          upiId: upi.upiId || "",
          payeeName: upi.payeeName || "",
          merchantCategoryCode: upi.merchantCategoryCode || "",
          paymentLink: upi.paymentLink || "",
          qrCodeSvg: upi.qrCodeSvg || "",
          qrCodeDataUri: upi.qrCodeDataUri || "",
        });
      }
      const razorpay = res.data.providers.razorpay;
      if (razorpay) {
        setRazorpaySettings(settings => ({
          ...settings,
          enabled: !!razorpay.enabled,
          enabledOnInvoices: razorpay.enabledOnInvoices ?? true,
          keyId: razorpay.keyId || "",
          keySecret: "",
          keySecretConfigured: !!razorpay.keySecretConfigured,
          webhookSecret: "",
          webhookSecretConfigured: !!razorpay.webhookSecretConfigured,
          linkedAccountId: razorpay.linkedAccountId || "",
          platformFeePercent: razorpay.platformFeePercent || "5",
          routeTransfersEnabled: !!razorpay.routeTransfersEnabled,
          payoutsEnabled: !!razorpay.payoutsEnabled,
          payoutAccountNumber: razorpay.payoutAccountNumber || "",
          payoutUpiId: razorpay.payoutUpiId || "",
          payoutPurpose: razorpay.payoutPurpose || "payout",
          payoutQueueIfLowBalance: !!razorpay.payoutQueueIfLowBalance,
        }));
      }
      setStatus(PaymentSettingsStatus.SUCCESS);
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
      setStatus(PaymentSettingsStatus.ERROR);
    }
  };

  const updateUpiSetting = (key: string, value: string | boolean) => {
    setUpiSettings(settings => ({ ...settings, [key]: value }));
  };

  const updateRazorpaySetting = (key: string, value: string | boolean) => {
    setRazorpaySettings(settings => ({ ...settings, [key]: value }));
  };

  const saveUpiSettings = async () => {
    try {
      setIsSavingUpi(true);
      const res = await paymentSettings.updateUpi({
        enabled: upiSettings.enabled || upiSettings.upiId.trim().length > 0,
        enabled_on_invoices: upiSettings.enabledOnInvoices,
        upi_id: upiSettings.upiId,
        payee_name: upiSettings.payeeName,
        merchant_category_code: upiSettings.merchantCategoryCode,
      });
      const upi = res.data.providers.upi;
      setUpiSettings({
        enabled: !!upi.enabled,
        enabledOnInvoices: upi.enabledOnInvoices ?? true,
        upiId: upi.upiId || "",
        payeeName: upi.payeeName || "",
        merchantCategoryCode: upi.merchantCategoryCode || "",
        paymentLink: upi.paymentLink || "",
        qrCodeSvg: upi.qrCodeSvg || "",
        qrCodeDataUri: upi.qrCodeDataUri || "",
      });
      toast.success(i18n.t("paymentSettingsPage.upiSaved"));
    } catch (error) {
      console.error("Failed to save UPI settings:", error);
      toast.error(i18n.t("paymentSettingsPage.upiSaveFailed"));
    } finally {
      setIsSavingUpi(false);
    }
  };

  const saveRazorpaySettings = async () => {
    try {
      setIsSavingRazorpay(true);
      const res = await paymentSettings.updateRazorpay({
        enabled: razorpaySettings.enabled,
        enabled_on_invoices: razorpaySettings.enabledOnInvoices,
        key_id: razorpaySettings.keyId,
        key_secret: razorpaySettings.keySecret,
        webhook_secret: razorpaySettings.webhookSecret,
        linked_account_id: razorpaySettings.linkedAccountId,
        platform_fee_percent: razorpaySettings.platformFeePercent,
        route_transfers_enabled: razorpaySettings.routeTransfersEnabled,
        payouts_enabled: razorpaySettings.payoutsEnabled,
        payout_account_number: razorpaySettings.payoutAccountNumber,
        payout_upi_id: razorpaySettings.payoutUpiId,
        payout_purpose: razorpaySettings.payoutPurpose,
        payout_queue_if_low_balance: razorpaySettings.payoutQueueIfLowBalance,
      });
      const razorpay = res.data.providers.razorpay;
      setRazorpaySettings(settings => ({
        ...settings,
        enabled: !!razorpay.enabled,
        enabledOnInvoices: razorpay.enabledOnInvoices ?? true,
        keyId: razorpay.keyId || "",
        keySecret: "",
        keySecretConfigured: !!razorpay.keySecretConfigured,
        webhookSecret: "",
        webhookSecretConfigured: !!razorpay.webhookSecretConfigured,
        linkedAccountId: razorpay.linkedAccountId || "",
        platformFeePercent: razorpay.platformFeePercent || "5",
        routeTransfersEnabled: !!razorpay.routeTransfersEnabled,
        payoutsEnabled: !!razorpay.payoutsEnabled,
        payoutAccountNumber: razorpay.payoutAccountNumber || "",
        payoutUpiId: razorpay.payoutUpiId || "",
        payoutPurpose: razorpay.payoutPurpose || "payout",
        payoutQueueIfLowBalance: !!razorpay.payoutQueueIfLowBalance,
      }));
      toast.success(i18n.t("paymentSettingsPage.razorpaySaved"));
    } catch (error) {
      console.error("Failed to save Razorpay settings:", error);
      toast.error(i18n.t("paymentSettingsPage.razorpaySaveFailed"));
    } finally {
      setIsSavingRazorpay(false);
    }
  };

  const copyText = async (value: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(i18n.t("paymentSettingsPage.copied"));
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error(i18n.t("paymentSettingsPage.copyFailed"));
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

                  {/* UPI Provider */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted">
                          <QrCode className="h-7 w-7 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-medium text-foreground">
                              {i18n.t("paymentSettingsPage.upiTitle")}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="border-border bg-accent text-foreground"
                            >
                              {i18n.t("paymentSettingsPage.freeUpiQr")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {i18n.t("paymentSettingsPage.upiDescription")}
                          </p>

                          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="upi_id">
                                {i18n.t("paymentSettingsPage.upiId")}
                              </Label>
                              <Input
                                id="upi_id"
                                value={upiSettings.upiId}
                                placeholder={i18n.t(
                                  "paymentSettingsPage.enterUpiId"
                                )}
                                onChange={e =>
                                  updateUpiSetting("upiId", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="upi_payee_name">
                                {i18n.t("paymentSettingsPage.payeeName")}
                              </Label>
                              <Input
                                id="upi_payee_name"
                                value={upiSettings.payeeName}
                                placeholder={i18n.t(
                                  "paymentSettingsPage.enterPayeeName"
                                )}
                                onChange={e =>
                                  updateUpiSetting("payeeName", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="upi_mcc">
                                {i18n.t(
                                  "paymentSettingsPage.merchantCategoryCode"
                                )}
                              </Label>
                              <Input
                                id="upi_mcc"
                                value={upiSettings.merchantCategoryCode}
                                placeholder={i18n.t(
                                  "paymentSettingsPage.merchantCategoryCodeOptional"
                                )}
                                onChange={e =>
                                  updateUpiSetting(
                                    "merchantCategoryCode",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2">
                                <Label
                                  htmlFor="upi_on_invoices"
                                  className="text-sm font-medium"
                                >
                                  {i18n.t(
                                    "paymentSettingsPage.showUpiOnInvoices"
                                  )}
                                </Label>
                                <Switch
                                  id="upi_on_invoices"
                                  checked={upiSettings.enabledOnInvoices}
                                  onCheckedChange={checked =>
                                    updateUpiSetting(
                                      "enabledOnInvoices",
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                              <DeviceMobile className="h-4 w-4 text-muted-foreground" />
                              <Label
                                htmlFor="upi_enabled"
                                className="text-sm font-medium"
                              >
                                {i18n.t("paymentSettingsPage.connected")}
                              </Label>
                              <Switch
                                id="upi_enabled"
                                checked={upiSettings.enabled}
                                onCheckedChange={checked =>
                                  updateUpiSetting("enabled", checked)
                                }
                              />
                            </div>
                            <Button
                              onClick={saveUpiSettings}
                              disabled={isSavingUpi}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isSavingUpi ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {i18n.t("paymentSettingsPage.savingUpi")}
                                </>
                              ) : (
                                i18n.t("paymentSettingsPage.saveUpi")
                              )}
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              {i18n.t("paymentSettingsPage.noGatewayFees")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {upiSettings.qrCodeDataUri && (
                        <div className="w-full shrink-0 rounded-lg border border-border bg-background p-4 lg:w-64">
                          <div className="mb-3 flex items-center justify-center border-b border-border pb-3">
                            <img
                              alt="Miru"
                              className="h-6"
                              src={MiruLogoWithTextSVG}
                            />
                          </div>
                          <img
                            alt="UPI QR code"
                            className="mx-auto h-40 w-40"
                            src={upiSettings.qrCodeDataUri}
                          />
                          <p className="mt-3 break-all text-center text-sm font-medium text-foreground">
                            {upiSettings.upiId}
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyText(upiSettings.upiId)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {i18n.t("paymentSettingsPage.copyUpiId")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyText(upiSettings.paymentLink)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {i18n.t("paymentSettingsPage.copyPaymentLink")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Razorpay Provider */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted">
                          <CreditCard className="h-7 w-7 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-medium text-foreground">
                              {i18n.t("paymentSettingsPage.razorpayTitle")}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="border-border bg-accent text-foreground"
                            >
                              {i18n.t("paymentSettingsPage.indiaPayments")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {i18n.t("paymentSettingsPage.razorpayDescription")}
                          </p>

                          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_key_id">
                                {i18n.t("paymentSettingsPage.razorpayKeyId")}
                              </Label>
                              <Input
                                id="razorpay_key_id"
                                value={razorpaySettings.keyId}
                                placeholder="rzp_live_..."
                                onChange={e =>
                                  updateRazorpaySetting("keyId", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_key_secret">
                                {i18n.t(
                                  "paymentSettingsPage.razorpayKeySecret"
                                )}
                              </Label>
                              <Input
                                id="razorpay_key_secret"
                                type="password"
                                value={razorpaySettings.keySecret}
                                placeholder={
                                  razorpaySettings.keySecretConfigured
                                    ? i18n.t(
                                        "paymentSettingsPage.secretAlreadySaved"
                                      )
                                    : i18n.t(
                                        "paymentSettingsPage.enterKeySecret"
                                      )
                                }
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "keySecret",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_webhook_secret">
                                {i18n.t(
                                  "paymentSettingsPage.razorpayWebhookSecret"
                                )}
                              </Label>
                              <Input
                                id="razorpay_webhook_secret"
                                type="password"
                                value={razorpaySettings.webhookSecret}
                                placeholder={
                                  razorpaySettings.webhookSecretConfigured
                                    ? i18n.t(
                                        "paymentSettingsPage.secretAlreadySaved"
                                      )
                                    : i18n.t(
                                        "paymentSettingsPage.enterWebhookSecret"
                                      )
                                }
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "webhookSecret",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_linked_account">
                                {i18n.t("paymentSettingsPage.linkedAccountId")}
                              </Label>
                              <Input
                                id="razorpay_linked_account"
                                value={razorpaySettings.linkedAccountId}
                                placeholder="acc_..."
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "linkedAccountId",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_platform_fee">
                                {i18n.t("paymentSettingsPage.platformFee")}
                              </Label>
                              <Input
                                id="razorpay_platform_fee"
                                min="0"
                                max="30"
                                step="0.1"
                                type="number"
                                value={razorpaySettings.platformFeePercent}
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "platformFeePercent",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2">
                                <Label
                                  htmlFor="razorpay_on_invoices"
                                  className="text-sm font-medium"
                                >
                                  {i18n.t(
                                    "paymentSettingsPage.showRazorpayOnInvoices"
                                  )}
                                </Label>
                                <Switch
                                  id="razorpay_on_invoices"
                                  checked={razorpaySettings.enabledOnInvoices}
                                  onCheckedChange={checked =>
                                    updateRazorpaySetting(
                                      "enabledOnInvoices",
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_payout_account">
                                {i18n.t(
                                  "paymentSettingsPage.payoutAccountNumber"
                                )}
                              </Label>
                              <Input
                                id="razorpay_payout_account"
                                value={razorpaySettings.payoutAccountNumber}
                                placeholder="RazorpayX account number"
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "payoutAccountNumber",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_payout_upi">
                                {i18n.t("paymentSettingsPage.payoutUpiId")}
                              </Label>
                              <Input
                                id="razorpay_payout_upi"
                                value={razorpaySettings.payoutUpiId}
                                placeholder="business@upi"
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "payoutUpiId",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="razorpay_payout_purpose">
                                {i18n.t("paymentSettingsPage.payoutPurpose")}
                              </Label>
                              <Input
                                id="razorpay_payout_purpose"
                                value={razorpaySettings.payoutPurpose}
                                placeholder="payout"
                                onChange={e =>
                                  updateRazorpaySetting(
                                    "payoutPurpose",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2">
                                <Label
                                  htmlFor="razorpay_route_transfers"
                                  className="text-sm font-medium"
                                >
                                  {i18n.t("paymentSettingsPage.routeTransfers")}
                                </Label>
                                <Switch
                                  id="razorpay_route_transfers"
                                  checked={
                                    razorpaySettings.routeTransfersEnabled
                                  }
                                  onCheckedChange={checked =>
                                    updateRazorpaySetting(
                                      "routeTransfersEnabled",
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-end">
                              <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2">
                                <Label
                                  htmlFor="razorpay_payouts_enabled"
                                  className="text-sm font-medium"
                                >
                                  {i18n.t("paymentSettingsPage.upiPayouts")}
                                </Label>
                                <Switch
                                  id="razorpay_payouts_enabled"
                                  checked={razorpaySettings.payoutsEnabled}
                                  onCheckedChange={checked =>
                                    updateRazorpaySetting(
                                      "payoutsEnabled",
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-end">
                              <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2">
                                <Label
                                  htmlFor="razorpay_queue_payouts"
                                  className="text-sm font-medium"
                                >
                                  {i18n.t("paymentSettingsPage.queuePayouts")}
                                </Label>
                                <Switch
                                  id="razorpay_queue_payouts"
                                  checked={
                                    razorpaySettings.payoutQueueIfLowBalance
                                  }
                                  onCheckedChange={checked =>
                                    updateRazorpaySetting(
                                      "payoutQueueIfLowBalance",
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                              <DeviceMobile className="h-4 w-4 text-muted-foreground" />
                              <Label
                                htmlFor="razorpay_enabled"
                                className="text-sm font-medium"
                              >
                                {i18n.t("paymentSettingsPage.connected")}
                              </Label>
                              <Switch
                                id="razorpay_enabled"
                                checked={razorpaySettings.enabled}
                                onCheckedChange={checked =>
                                  updateRazorpaySetting("enabled", checked)
                                }
                              />
                            </div>
                            <Button
                              onClick={saveRazorpaySettings}
                              disabled={isSavingRazorpay}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isSavingRazorpay ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {i18n.t("paymentSettingsPage.savingRazorpay")}
                                </>
                              ) : (
                                i18n.t("paymentSettingsPage.saveRazorpay")
                              )}
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              {i18n.t("paymentSettingsPage.razorpayRouteNote")}
                            </p>
                          </div>
                        </div>
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
