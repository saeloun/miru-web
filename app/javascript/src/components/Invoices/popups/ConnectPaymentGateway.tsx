import React from "react";

import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Modal } from "StyledComponents";

const ConnectPaymentGateway = ({
  setShowConnectPaymentDialog,
  showConnectPaymentDialog,
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showConnectPaymentDialog}
      onClose={() => setShowConnectPaymentDialog(false)}
    >
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h6 className="form__title">No payment gateway connected</h6>
        <button
          className="text-miru-gray-1000"
          type="button"
          onClick={() => setShowConnectPaymentDialog(false)}
        >
          <XIcon size={16} weight="bold" />
        </button>
      </div>
      <div className="my-8 flex-col">
        <p className="mt-2 font-normal">
          No payment gateways are connected. Clients won't be able to make a
          payment against the invoice.
        </p>
      </div>
      <div className="text-center">
        <button
          className="button__bg_purple"
          onClick={e => {
            e.stopPropagation();
            setShowConnectPaymentDialog(false);
            navigate("/profile/edit/payment");
          }}
        >
          Connect payment
        </button>
      </div>
    </Modal>
  );
};

export default ConnectPaymentGateway;
