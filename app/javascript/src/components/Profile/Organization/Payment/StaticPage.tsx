import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import React from "react";

import Loader from "common/Loader/index";
import { StripeLogoSVG, disconnectAccountSVG } from "miruIcons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Button } from "components/ui/button";
import { CreditCard } from "phosphor-react";

import EditHeader from "../../Common/EditHeader";

const StaticPage = ({
  isStripeConnected,
  setShowDisconnectDialog,
  connectStripe,
  status,
}) => (
  <>
    <EditHeader
      showButtons={false}
      subTitle="Connect payment gateways"
      title="Payment Settings"
    />
    {status === PaymentSettingsStatus.LOADING ? (
      <div className="flex min-h-70v items-center justify-center">
        <Loader />
      </div>
    ) : (
      status === PaymentSettingsStatus.SUCCESS && (
        <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
                <CreditCard className="mr-2" color="#1D1A31" size={16} />
                Payment Gateway Integration
              </CardTitle>
              <CardDescription>
                Manage your payment gateway connections for accepting online
                payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stripe Integration */}
                <div className="flex items-center justify-between rounded-lg border p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 border-r border-gray-200 pr-6">
                      <img src={StripeLogoSVG} alt="Stripe" className="h-8" />
                    </div>
                    <div className="max-w-md">
                      <p className="text-sm text-miru-dark-purple-1000">
                        {isStripeConnected
                          ? "Your Stripe account is connected and ready to accept online payments"
                          : "Connect with your existing Stripe account or create a new account"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isStripeConnected ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDisconnectDialog(true)}
                        className="flex items-center gap-2"
                      >
                        <img
                          src={disconnectAccountSVG}
                          alt=""
                          className="h-4 w-4"
                        />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={connectStripe}
                        className="flex items-center gap-2"
                      >
                        Connect Stripe
                      </Button>
                    )}
                  </div>
                </div>
                {/* PayPal Integration (commented out) */}
                {/* <div className="flex items-center justify-between rounded-lg border p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 border-r border-gray-200 pr-6">
                      <img src={Paypal_Logo} alt="PayPal" className="h-8" />
                    </div>
                    <div className="max-w-md">
                      <p className="text-sm text-miru-dark-purple-1000">
                        Connect with your existing PayPal account or create a new account
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="default" size="sm">
                      Connect PayPal
                    </Button>
                  </div>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    )}
  </>
);

export default StaticPage;
