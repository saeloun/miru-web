import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import invoicesApi from "apis/invoices";
import Loader from "common/Loader/index";
import ConnectPaymentGateway from "components/Invoices/popups/ConnectPaymentGateway";
import StripeDisabledInvoice from "components/Invoices/popups/StripeDisabledInvoice";
import { useUserContext } from "context/UserContext";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";
import MobileView from "./MobileView";

import NoInvoices from "../List/NoInvoices";

const ClientInvoiceDetails = () => {
  const { isDesktop } = useUserContext();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showConnectPaymentDialog, setShowConnectPaymentDialog] =
    useState<boolean>(false);

  const [showStripeDisabledDialog, setShowStripeDisabledDialog] =
    useState<boolean>(false);

  useEffect(() => {
    fetchViewInvoice();
  }, []);

  const fetchViewInvoice = async () => {
    try {
      const res = await invoicesApi.viewInvoice(params.id);
      setData(res.data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (data) {
    const {
      url,
      invoice,
      logo,
      lineItems,
      company,
      client,
      stripe_connected_account,
      bank_account,
    } = data;

    return isDesktop ? (
      <div className="flex flex-col justify-between">
        <div className="font-manrope">
          <Header
            invoice={invoice}
            setShowConnectPaymentDialog={setShowConnectPaymentDialog}
            setShowStripeDisabledDialog={setShowStripeDisabledDialog}
            stripeUrl={url}
            stripe_connected_account={stripe_connected_account}
          />
          <div className="m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
            <InvoiceDetails
              bank_account={bank_account}
              client={client}
              company={company}
              invoice={invoice}
              lineItems={lineItems}
              logo={logo}
            />
          </div>
          {showConnectPaymentDialog && (
            <ConnectPaymentGateway
              isInvoiceEmail
              invoice={invoice}
              setShowConnectPaymentDialog={setShowConnectPaymentDialog}
              showConnectPaymentDialog={showConnectPaymentDialog}
            />
          )}
          {showStripeDisabledDialog && (
            <StripeDisabledInvoice
              setShowStripeDisabledDialog={setShowStripeDisabledDialog}
              showStripeDisabledDialog={showStripeDisabledDialog}
            />
          )}
        </div>
      </div>
    ) : (
      <MobileView data={data} />
    );
  }

  return <NoInvoices />;
};

export default ClientInvoiceDetails;
