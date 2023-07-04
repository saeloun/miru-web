import React from "react";

import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";

import paymentSettings from "apis/payment-settings";

interface IProps {
  setShowDisconnectDialog: any;
  showDisconnectDialog: boolean;
  paymentMode?: any;
  isDesktop: boolean;
}

const DisconnectPayment = ({
  setShowDisconnectDialog,
  showDisconnectDialog,
  paymentMode = "Stripe",
  isDesktop,
}: IProps) => {
  const navigate = useNavigate();
  const disconnectPayment = async () => {
    await paymentSettings.disconnectStripe();
    setShowDisconnectDialog(false);
    if (isDesktop) {
      navigate("/profile/edit/payment");
    } else {
      navigate("/profile/edit/option");
    }
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDisconnectDialog}
      onClose={() => setShowDisconnectDialog(false)}
    >
      <div className="mb-8 mt-4 flex-col">
        <h6 className="mb-2 text-2xl font-bold">Disconnect Stripe</h6>
        <p className="mt-2 font-normal">
          Are you sure you want to disconnect{" "}
          <b className="font-bold">{paymentMode}</b> payment gateway? You won’t
          be able to receive payments through {paymentMode} until you connect a{" "}
          {paymentMode} account.
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
          CANCEL
        </Button>
        <Button
          className="ml-2 w-1/2 bg-miru-red-400 text-white"
          size="medium"
          onClick={() => {
            disconnectPayment();
          }}
        >
          Disconnect
        </Button>
      </div>
    </Modal>
  );
};

export default DisconnectPayment;
