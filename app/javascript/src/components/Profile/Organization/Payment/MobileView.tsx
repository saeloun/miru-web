import React from "react";

import {
  ArrowLeftIcon,
  PaymentsIcon,
  StripeLogoSVG,
  disconnectAccountSVG,
  ConnectMobileSVG,
} from "miruIcons";
import { Button } from "StyledComponents";

import Loader from "common/Loader/index";
import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import BankDetails from "./BankDetails";

interface MobileViewProps {
  title: string;
  onBackArrowClick?: () => void;
  isStripeConnected: boolean;
  setShowDisconnectDialog: any;
  connectStripe: any;
  status: string;
  editBankDetails: boolean;
  setEditBankDetails: React.Dispatch<React.SetStateAction<boolean>>;
  handleCancelAction: () => void;
  handleUpdateDetails: () => void;
  isLoading: boolean;
  bankName: string;
  accountNumber: string;
  accountType: string;
  routingNumber: string;
  setBankName: React.Dispatch<React.SetStateAction<string>>;
  setAccountNumber: React.Dispatch<React.SetStateAction<string>>;
  setAccountType: React.Dispatch<React.SetStateAction<string>>;
  setRoutingNumber: React.Dispatch<React.SetStateAction<string>>;
  errDetails: object;
}

const MobileView = ({
  title,
  onBackArrowClick,
  isStripeConnected,
  setShowDisconnectDialog,
  connectStripe,
  status,
  editBankDetails,
  setEditBankDetails,
  handleCancelAction,
  handleUpdateDetails,
  isLoading,
  bankName,
  accountNumber,
  accountType,
  routingNumber,
  setBankName,
  setAccountNumber,
  setAccountType,
  setRoutingNumber,
  errDetails,
}: MobileViewProps) => (
  <>
    <section className="flex h-12 w-full items-center justify-between bg-miru-white-1000 p-3 shadow-c1">
      <div className="flex items-center gap-3">
        <div>
          <button
            className="outline-none border-none bg-transparent text-miru-dark-purple-1000"
            onClick={onBackArrowClick}
          >
            <ArrowLeftIcon color="#1D1A31" size={16} />
          </button>
        </div>
        <div>
          <h1 className="font-manrope text-base font-medium leading-5.5">
            {title}
          </h1>
        </div>
      </div>
      {editBankDetails ? (
        <div>
          <Button
            className="mr-2 sm:px-6 sm:py-1"
            style="secondary"
            onClick={() => handleCancelAction()}
          >
            Cancel
          </Button>
          <Button
            className="bg-white font-bold sm:px-8 sm:py-1"
            style="secondary"
            onClick={() => handleUpdateDetails()}
          >
            Save
          </Button>
        </div>
      ) : (
        <Button
          className="sm:py-1"
          style="ternary"
          onClick={() => setEditBankDetails(true)}
        >
          Edit Bank Details
        </Button>
      )}
    </section>
    <div className="mx-4 my-5">
      <div className="flex flex-row items-center">
        <div>
          <PaymentsIcon size={16} />
        </div>
        <div className="px-2">Payment Gateways</div>
      </div>
      <div>
        {status === PaymentSettingsStatus.LOADING ? (
          <Loader />
        ) : (
          status === PaymentSettingsStatus.SUCCESS && (
            <div className="miru-gray-400 mb-10 border-b pb-4">
              <div className="mt-5 w-fit">
                <img height={34} src={StripeLogoSVG} width={72} />
              </div>
              <div className="my-4">
                Connect with your existing Stripe account or create a new
                account
              </div>
              {isStripeConnected ? (
                <div className="flex flex-row">
                  <button
                    className="mt-4 flex w-full flex-row items-center justify-center rounded border border-miru-red-400 px-2 text-miru-red-400"
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    <div className="logo-container mr-1 py-2">
                      <img src={disconnectAccountSVG} />
                    </div>
                    Disconnect
                  </button>
                </div>
              ) : (
                <button onClick={connectStripe}>
                  <img className="w-full px-2" src={ConnectMobileSVG} />
                </button>
              )}
            </div>
          )
        )}
      </div>
      {isLoading ? (
        <Loader />
      ) : (
        <BankDetails
          accountNumber={accountNumber}
          accountType={accountType}
          bankName={bankName}
          editBankDetails={editBankDetails}
          errDetails={errDetails}
          isLoading={isLoading}
          routingNumber={routingNumber}
          setAccountNumber={setAccountNumber}
          setAccountType={setAccountType}
          setBankName={setBankName}
          setRoutingNumber={setRoutingNumber}
        />
      )}
    </div>
  </>
);

export default MobileView;
