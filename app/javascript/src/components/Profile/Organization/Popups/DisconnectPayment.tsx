import React from "react";

import { paymentSettings } from "apis/api";
import { i18n } from "i18n-js";
import { Modal, Button } from "StyledComponents";

interface IProps {
  setShowDisconnectDialog: any;
  showDisconnectDialog: boolean;
  paymentMode?: any;
  fetchPaymentSettings: any;
}

const DisconnectPayment = ({
  setShowDisconnectDialog,
  showDisconnectDialog,
  paymentMode = "Stripe",
  fetchPaymentSettings,
}: IProps) => {
  const disconnectPayment = async () => {
    await paymentSettings.disconnectStripe();
    setShowDisconnectDialog(false);
    fetchPaymentSettings();
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDisconnectDialog}
      onClose={() => setShowDisconnectDialog(false)}
    >
      <div className="mb-8 mt-4 flex-col">
        <h6 className="mb-2 text-2xl font-bold">
          {i18n.t("paymentSettingsPage.disconnectDialogTitle")}
        </h6>
        <p className="mt-2 font-normal">
          {i18n.t("paymentSettingsPage.disconnectPaymentModeDescription", {
            paymentMode,
          })}
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowDisconnectDialog(false);
          }}
        >
          {i18n.t("cancel").toUpperCase()}
        </Button>
        <Button
          className="ml-2 w-1/2 bg-destructive text-white"
          size="medium"
          onClick={() => {
            disconnectPayment();
          }}
        >
          {i18n.t("paymentSettingsPage.disconnect")}
        </Button>
      </div>
    </Modal>
  );
};

export default DisconnectPayment;
