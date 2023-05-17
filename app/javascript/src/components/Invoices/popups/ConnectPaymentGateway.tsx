import React from "react";

import { useNavigate } from "react-router-dom";

const ConnectPaymentGateway = ({
  setShowConnectPaymentDialog,
  setIsSending,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)",
        }}
      >
        <div className="relative flex h-full w-full items-center justify-center px-4">
          <div className="modal-width min-w-0 transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:min-w-400 sm:max-w-md sm:align-middle">
            <div className="my-8 flex-col">
              <h6 className="mb-2 text-2xl font-bold">No payment gateway</h6>
              <p className="mt-2 font-normal">
                No payment gateways are connected. Clients won't be able to make
                a payment against the invoice.
              </p>
            </div>
            <div className="flex justify-between">
              <button
                className="button__bg_transparent"
                onClick={e => {
                  e.stopPropagation();
                  setShowConnectPaymentDialog(false);
                  setIsSending(true);
                }}
              >
                SEND INVOICE
              </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectPaymentGateway;
