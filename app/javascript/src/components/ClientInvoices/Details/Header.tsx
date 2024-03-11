import React, { useRef, useState } from "react";

import { useOutsideClick } from "helpers";
import {
  ReportsIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
} from "miruIcons";
import { Badge, Button, MoreOptions, Toastr, Tooltip } from "StyledComponents";

import { handleDownloadInvoice } from "components/Invoices/common/utils";
import getStatusCssClass from "utils/getBadgeStatus";

const Header = ({
  invoice,
  stripeUrl,
  stripe_connected_account,
  setShowConnectPaymentDialog,
  setShowStripeDisabledDialog,
}) => {
  const [isMoreOptionsVisible, setIsMoreOptionsVisible] =
    useState<boolean>(false);
  const wrapperRef = useRef(null);
  const { invoice_number, status, stripe_enabled } = invoice;

  useOutsideClick(
    wrapperRef,
    () => setIsMoreOptionsVisible(false),
    isMoreOptionsVisible
  );

  const handleDownloadAction = invoice => {
    Toastr.success("Download request sent");
    handleDownloadInvoice(invoice);
    setIsMoreOptionsVisible(false);
  };

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-row">
        <div className="mr-2 flex self-center">
          <p className="text-4xl font-bold">Invoice #{invoice_number}</p>
        </div>
        <div className="ml-2 flex self-center">
          <Badge
            className={`${getStatusCssClass(status)} uppercase`}
            text={status}
          />
        </div>
      </div>
      <div className="justify-items-right flex flex-row">
        <div className="send-button-container ml-1 flex flex-col justify-items-center">
          {status == "waived" ? (
            <Tooltip
              content="This invoice has been waived off by the sender"
              wrapperClassName="relative block max-w-full "
            >
              <button
                disabled
                className="flex h-10 w-44 cursor-not-allowed flex-row items-center justify-center rounded bg-indigo-100"
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="mr-1">
                    <ReportsIcon color="white" size={16} weight="bold" />
                  </div>
                  <p className="ml-1 text-base font-bold tracking-widest text-miru-white-1000">
                    PAY
                  </p>
                </div>
              </button>
            </Tooltip>
          ) : (
            <button
              disabled={status == "paid"}
              className={`flex h-10 w-44 flex-row items-center justify-center rounded
              ${
                status == "paid"
                  ? "cursor-not-allowed bg-indigo-100"
                  : "bg-miru-han-purple-1000"
              }`}
              onClick={() => {
                if (status != "paid") {
                  if (!stripe_enabled) {
                    setShowStripeDisabledDialog(true);
                  } else if (stripe_connected_account) {
                    window.location.href = stripeUrl;
                  } else {
                    setShowConnectPaymentDialog(true);
                  }
                }
              }}
            >
              <div className="flex flex-row items-center justify-between">
                <div className="mr-1">
                  <ReportsIcon color="white" size={16} weight="bold" />
                </div>
                <p className="ml-1 text-base font-bold tracking-widest text-miru-white-1000">
                  PAY
                </p>
              </div>
            </button>
          )}
        </div>
        <div className="relative">
          <Button
            className="ml-2 rounded border border-miru-han-purple-1000 bg-miru-gray-1000 p-2.5 text-miru-han-purple-1000 opacity-50"
            style="ternary"
            onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
          >
            <DotsThreeVerticalIcon size={16} />
          </Button>
          {isMoreOptionsVisible && (
            <MoreOptions
              className="right-0"
              setVisibilty={setIsMoreOptionsVisible}
            >
              <li
                className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
                onClick={() => handleDownloadAction(invoice)}
              >
                <DownloadSimpleIcon className="mr-4" size={16} weight="bold" />
                Download
              </li>
            </MoreOptions>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
