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
      <p className="mt-2 font-normal">
        We apologize, but Stripe is currently unavailable for this invoice.
        <br />
        Please contact the sender to enable Stripe or use another payment option
        like ACH.
      </p>
    </div>
  </Modal>
);

export default StripeDisabledInvoice;
