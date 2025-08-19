import React, { useState, useEffect } from "react";
import { CreditCard, AlertCircle, CheckCircle2, ExternalLink, Loader2, Building2, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert";
import { Badge } from "../../../ui/badge";
import { Separator } from "../../../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import paymentSettings from "../../../../apis/payment-settings";
import { ApiStatus as PaymentSettingsStatus } from "../../../../constants/index";
import { Skeleton } from "../../../ui/skeleton";

interface ModernPaymentSettingsProps {
  onBack?: () => void;
}

const ModernPaymentSettings: React.FC<ModernPaymentSettingsProps> = ({ onBack }) => {
  const [status, setStatus] = useState<PaymentSettingsStatus>(PaymentSettingsStatus.IDLE);
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState<boolean>(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Payment Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure payment processing for your organization
              </p>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back to Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Payment Providers Section */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-700" />
                <CardTitle>Payment Providers</CardTitle>
              </div>
              <CardDescription>
                Connect payment providers to accept online payments from clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === PaymentSettingsStatus.LOADING ? (
                <LoadingSkeleton />
              ) : status === PaymentSettingsStatus.ERROR ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load payment settings. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Stripe Provider */}
                  <div className="border rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
                          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">Stripe</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Accept credit cards, debit cards, and popular payment methods
                          </p>
                          {isStripeConnected && stripeAccountDetails && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-gray-700">
                                  Connected to {stripeAccountDetails.email || "Stripe Account"}
                                </span>
                              </div>
                              {stripeAccountDetails.charges_enabled && (
                                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                  Charges Enabled
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isStripeConnected ? (
                          <>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Connected
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDisconnectDialog(true)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={connectStripe}
                            disabled={isConnecting}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                Connect Stripe
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
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Features & Benefits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Secure Payments</p>
                          <p className="text-sm text-gray-600">PCI-compliant payment processing</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Building2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Multiple Currencies</p>
                          <p className="text-sm text-gray-600">Accept payments in 135+ currencies</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CreditCard className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Various Payment Methods</p>
                          <p className="text-sm text-gray-600">Cards, wallets, bank transfers, and more</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Instant Setup</p>
                          <p className="text-sm text-gray-600">Start accepting payments in minutes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                If you need assistance setting up payment processing or have questions about fees and capabilities:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="bg-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" className="bg-white">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Stripe Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your Stripe account? You will no longer be able to accept payments through Stripe until you reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={disconnectStripe}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernPaymentSettings;