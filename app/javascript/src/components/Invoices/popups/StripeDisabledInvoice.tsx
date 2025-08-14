import React from "react";

import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";

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
      <Button
        className="text-miru-gray-1000"
        style="ternary"
        onClick={() => setShowStripeDisabledDialog(false)}
      >
        <XIcon size={16} weight="bold" />
      </Button>
    </div>
    <div className="my-8 flex-col">
      <p className="mt-2 font-normal">
        The sender hasn&apos;t enabled Stripe payments for this invoice.
        <br />
        You can reach out to them to activate it, or choose an alternative
        payment method like ACH.
      </p>
    </div>
  </Modal>
);

export default StripeDisabledInvoice;
