import React, { useEffect, useState } from "react";

import { InstagramSVG, TwitterSVG, MiruLogoWithTextSVG } from "miruIcons";
import { useParams } from "react-router-dom";

import invoicesApi from "apis/invoices";
import Loader from "common/Loader";
import MobileView from "components/ClientInvoices/Details/MobileView";
import ConnectPaymentGateway from "components/Invoices/popups/ConnectPaymentGateway";
import StripeDisabledInvoice from "components/Invoices/popups/StripeDisabledInvoice";
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

  const [showStripeDisabledDialog, setShowStripeDisabledDialog] =
    useState<boolean>(false);

  useEffect(() => {
    fetchViewInvoice();
  }, []);

  const fetchViewInvoice = async () => {
    const res = await invoicesApi.viewInvoice(params.id);
    setData(res.data);
    setIsStripeConnected(res.data.stripe_connected_account);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-80v w-full flex-col justify-center">
        <Loader />
      </div>
    );
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
          setShowStripeDisabledDialog={setShowStripeDisabledDialog}
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
        {showStripeDisabledDialog && (
          <StripeDisabledInvoice
            setShowStripeDisabledDialog={setShowStripeDisabledDialog}
            showStripeDisabledDialog={showStripeDisabledDialog}
          />
        )}
      </div>
      <div className="flex justify-between bg-miru-han-purple-1000 px-28 py-3 font-manrope text-white">
        <span className="text-center text-xs font-normal leading-4">
          © Miru 2023. All rights reserved.
        </span>
        <span className="flex w-1/4 justify-between text-center text-xs font-normal leading-4">
          <a href="https://www.miru.so/" rel="noreferrer" target="_blank">
            miru.so/
          </a>
          <a
            href="https://www.instagram.com/getmiru/"
            rel="noreferrer"
            target="_blank"
          >
            <img height="16px" src={InstagramSVG} width="16px" />
          </a>
          <a
            href="https://twitter.com/i/flow/login?redirect_after_login=%2Fgetmiru"
            rel="noreferrer"
            target="_blank"
          >
            <img height="16px" src={TwitterSVG} width="16px" />
          </a>
        </span>
      </div>
    </div>
  ) : (
    <MobileView data={data} />
  );
};

export default InvoiceEmail;
