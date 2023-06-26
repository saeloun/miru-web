import React, { useEffect, useState } from "react";

import { InstagramSVG, TwitterSVG, MiruLogoWithTextSVG } from "miruIcons";
import { useParams } from "react-router-dom";
import { Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import paymentSettings from "apis/payment-settings";
import Loader from "common/Loader";
import MobileView from "components/ClientInvoices/Details/MobileView";
import ConnectPaymentGateway from "components/Invoices/popups/ConnectPaymentGateway";
import { useUserContext } from "context/UserContext";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const InvoiceEmail = () => {
  const params = useParams();
  const { isDesktop } = useUserContext();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(null);
  const [isInvoiceEmail, setIsInvoiceEmail] = useState<boolean>(false);
  const [showConnectPaymentDialog, setShowConnectPaymentDialog] =
    useState<boolean>(false);

  useEffect(() => {
    fetchViewInvoice();
    fetchPaymentSettings();
  }, []);

  const fetchViewInvoice = async () => {
    const res = await invoicesApi.viewInvoice(params.id);
    setData(res.data);
    setLoading(false);
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await paymentSettings.get();
      setIsStripeConnected(res.data.providers.stripe.connected);
    } catch {
      Toastr.error("ERROR! CONNECTING TO PAYMENTS");
    }
  };

  if (loading) {
    return <Loader />;
  }

  const { url, invoice, logo, lineItems, company, client } = data;

  return isDesktop ? (
    <div className="flex flex-col justify-between">
      <div className="flex h-16 justify-start bg-miru-han-purple-1000 px-24 font-manrope text-white">
        <img src={MiruLogoWithTextSVG} />
      </div>
      <div className="mx-auto max-w-6xl px-2 font-manrope md:px-11">
        <Header
          invoice={invoice}
          isStripeConnected={isStripeConnected}
          setIsInvoiceEmail={setIsInvoiceEmail}
          setShowConnectPaymentDialog={setShowConnectPaymentDialog}
          stripeUrl={url}
        />
        <div className="m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
          <InvoiceDetails
            client={client}
            company={company}
            invoice={invoice}
            lineItems={lineItems}
            logo={logo}
          />
        </div>
        {isInvoiceEmail && showConnectPaymentDialog && (
          <ConnectPaymentGateway
            isInvoiceEmail
            invoice={invoice}
            setShowConnectPaymentDialog={setShowConnectPaymentDialog}
            showConnectPaymentDialog={showConnectPaymentDialog}
          />
        )}
      </div>
      <div className="flex justify-between bg-miru-han-purple-1000 px-28 py-3 font-manrope text-white">
        <span className="text-center text-xs font-normal leading-4">
          © Miru 2022. All rights reserved.
        </span>
        <span className="flex w-1/4 justify-between text-center text-xs font-normal leading-4">
          miru.so/
          <img height="16px" src={InstagramSVG} width="16px" />
          <img height="16px" src={TwitterSVG} width="16px" />
        </span>
      </div>
    </div>
  ) : (
    <MobileView data={data} />
  );
};

export default InvoiceEmail;
