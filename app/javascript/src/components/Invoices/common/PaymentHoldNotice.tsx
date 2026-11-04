import React from "react";

import { i18n } from "../../../i18n";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";

const PaymentHoldNotice = () => (
  <Alert className="my-4" role="status">
    <AlertTitle>{i18n.t("invoices.paymentOnHoldTitle")}</AlertTitle>
    <AlertDescription>
      {i18n.t("invoices.paymentOnHoldDescription")}
    </AlertDescription>
  </Alert>
);

export default PaymentHoldNotice;
