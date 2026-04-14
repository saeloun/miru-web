import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import React from "react";

import Loader from "common/Loader/index";
import { i18n } from "../../../../i18n";
import {
  ArrowLeftIcon,
  PaymentsIcon,
  StripeLogoSVG,
  disconnectAccountSVG,
  ConnectMobileSVG,
} from "miruIcons";

interface MobileViewProps {
  title: string;
  onBackArrowClick?: () => void;
  isStripeConnected: boolean;
  setShowDisconnectDialog: any;
  connectStripe: any;
  status: string;
}

const MobileView = ({
  title,
  onBackArrowClick,
  isStripeConnected,
  setShowDisconnectDialog,
  connectStripe,
  status,
}: MobileViewProps) => (
  <>
    <section className="flex h-12 w-full items-center justify-between bg-background p-3 shadow-c1">
      <div className="flex items-center gap-3">
        <div>
          <button
            className="outline-none border-none bg-transparent text-foreground"
            onClick={onBackArrowClick}
          >
            <ArrowLeftIcon color="#1D1A31" size={16} />
          </button>
        </div>
        <div>
          <h1 className="font-sans text-base font-medium leading-5.5">
            {title}
          </h1>
        </div>
      </div>
    </section>
    <div className="mx-4 my-5">
      <div className="flex flex-row items-center">
        <div>
          <PaymentsIcon size={16} />
        </div>
        <div className="px-2">{i18n.t("paymentSettingsPage.title")}</div>
      </div>
      <div>
        {status === PaymentSettingsStatus.LOADING ? (
          <Loader />
        ) : (
          status === PaymentSettingsStatus.SUCCESS && (
            <div className="border-b border-border pb-4">
              <div className="mt-5 w-fit">
                <img height={34} src={StripeLogoSVG} width={72} />
              </div>
              <div className="my-4">
                {i18n.t("paymentSettingsPage.description")}
              </div>
              {isStripeConnected ? (
                <div className="flex flex-row">
                  <button
                    className="mt-4 flex w-full flex-row items-center justify-center rounded border border-destructive px-2 text-destructive"
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    <div className="logo-container mr-1 py-2">
                      <img src={disconnectAccountSVG} />
                    </div>
                    {i18n.t("paymentSettingsPage.disconnect")}
                  </button>
                </div>
              ) : (
                <button onClick={connectStripe}>
                  <img className="w-full px-2" src={ConnectMobileSVG} />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  </>
);

export default MobileView;
