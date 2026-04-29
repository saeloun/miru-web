import React from "react";

import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";
import { i18n } from "../../../i18n";

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
      <h6 className="text-2xl font-bold">
        {i18n.t("invoices.stripeDisabled")}
      </h6>
      <Button
        className="text-foreground"
        style="ternary"
        onClick={() => setShowStripeDisabledDialog(false)}
      >
        <XIcon size={16} weight="bold" />
      </Button>
    </div>
    <div className="my-8 flex-col">
      <p className="mt-2 font-normal">
        {i18n.t("invoices.stripeDisabledMessage")}
      </p>
    </div>
  </Modal>
);

export default StripeDisabledInvoice;
