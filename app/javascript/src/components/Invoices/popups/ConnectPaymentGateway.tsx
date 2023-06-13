import React from "react";

import Logger from "js-logger";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Modal } from "StyledComponents";

import invoicesApi from "apis/invoices";

const ConnectPaymentGateway = ({
  setShowConnectPaymentDialog,
  showConnectPaymentDialog,
  invoice,
  setIsSending,
}) => {
  const navigate = useNavigate();

  const updateInvoice = async () => {
    const invoiceStatuses = ["sent", "paid", "draft"];
    if (invoiceStatuses.includes(invoice.status)) return;

    try {
      const res = await invoicesApi.updateInvoice(invoice.id, {
        status: "draft",
      });

      return res;
    } catch (error) {
      Logger.log(error);
    }
  };

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
          className="button__bg_purple mb-3 block w-full"
          onClick={e => {
            e.stopPropagation();
            setShowConnectPaymentDialog(false);
            updateInvoice();
            navigate("/profile/edit/payment");
          }}
        >
          Go to Payment Settings
        </button>
        <button
          className="button__bg_purple w-full"
          onClick={e => {
            e.stopPropagation();
            setIsSending(true);
            setShowConnectPaymentDialog(false);
          }}
        >
          Send Without Payment Gateway
        </button>
      </div>
    </Modal>
  );
};

export default ConnectPaymentGateway;
