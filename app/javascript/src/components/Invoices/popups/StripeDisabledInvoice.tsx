import React from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

const StripeDisabledInvoice = ({
  showStripeDisabledDialog,
  setShowStripeDisabledDialog,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
    isOpen={showStripeDisabledDialog}
    onClose={() => setShowStripeDisabledDialog(false)}
  >
    <div className="mt-2 mb-4 flex items-center justify-between">
      <h6 className="text-2xl font-bold">Stripe disabled for this invoice</h6>
      <button
        className="text-miru-gray-1000"
        type="button"
        onClick={() => setShowStripeDisabledDialog(false)}
      >
        <XIcon size={16} weight="bold" />
      </button>
    </div>
    <div className="my-8 flex-col">
      <p className="m-2 font-normal">
        Stripe payment gateway is disabled for paying this invoice.
        <br />
        <br />
        Please reach out to the invoice sender to connect stripe payment gateway
        to enable you to make invoice payment using stripe.
      </p>
      <p className="m-2 text-center font-semibold">OR</p>
      <p className="m-2 font-normal">
        Please pay the invoice amount to the invoice sender directly by using
        ACH Bank transfer.
      </p>
    </div>
  </Modal>
);

export default StripeDisabledInvoice;
