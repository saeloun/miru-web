import React from "react";

import { invoicesApi } from "apis/api";
import { XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Modal, Toastr } from "StyledComponents";
import { i18n } from "../../../i18n";

const ConnectPaymentGateway = ({
  setShowConnectPaymentDialog,
  showConnectPaymentDialog,
  invoice,

  setIsSending = _val => {},
  isInvoiceEmail = false,
}) => {
  const navigate = useNavigate();

  const updateInvoice = async () => {
    const invoiceStatuses = ["sent", "paid", "draft"];
    if (!Object.keys(invoice).includes("status")) return;

    if (invoiceStatuses.includes(invoice.status)) return;

    try {
      const res = await invoicesApi.updateInvoice(invoice.id, {
        status: "draft",
      });

      return res;
    } catch (error) {
      Toastr.error(error);
    }
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showConnectPaymentDialog}
      onClose={() => setShowConnectPaymentDialog(false)}
    >
      <div className="mt-2 mb-4 flex items-center justify-between">
        <h6 className="text-2xl font-bold">
          {i18n.t("invoices.noPaymentGateway")}
        </h6>
        <button
          className="text-foreground"
          type="button"
          onClick={() => setShowConnectPaymentDialog(false)}
        >
          <XIcon size={16} weight="bold" />
        </button>
      </div>
      {isInvoiceEmail ? (
        <div className="my-8 flex-col">
          <p className="mt-2 font-normal">
            {i18n.t("invoices.paymentGatewayError")}
          </p>
        </div>
      ) : (
        <>
          <div className="my-8 flex-col">
            <p className="mt-2 font-normal">
              {i18n.t("invoices.paymentGatewayWarning")}
            </p>
          </div>
          <div className="text-center">
            <button
              className="button__bg_purple mb-3 block w-full text-xs sm:text-base"
              onClick={e => {
                e.stopPropagation();
                setShowConnectPaymentDialog(false);
                updateInvoice();
                navigate("/settings/payment");
              }}
            >
              {i18n.t("invoices.goToPaymentSettings")}
            </button>
            <button
              className="button__bg_purple w-full text-xs sm:text-base"
              onClick={e => {
                e.stopPropagation();
                setIsSending(true);
                setShowConnectPaymentDialog(false);
              }}
            >
              {i18n.t("invoices.sendWithoutPaymentGateway")}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConnectPaymentGateway;
