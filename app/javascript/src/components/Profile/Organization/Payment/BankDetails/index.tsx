import React from "react";

import { BankIcon } from "miruIcons";

import EditBankDetails from "./EditBankDetails";

const BankDetails = ({
  editBankDetails,
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
}) => (
  <div className="flex flex-col lg:flex-row">
    <div className="flex w-1/3 pr-4">
      <BankIcon className="mt-1 mr-2" size={20} />
      <span>Bank Details</span>
    </div>
    {editBankDetails ? (
      <EditBankDetails
        accountNumber={accountNumber}
        accountType={accountType}
        bankName={bankName}
        errDetails={errDetails}
        isLoading={isLoading}
        routingNumber={routingNumber}
        setAccountNumber={setAccountNumber}
        setAccountType={setAccountType}
        setBankName={setBankName}
        setRoutingNumber={setRoutingNumber}
      />
    ) : (
      <div className="mt-10 lg:mt-0 lg:w-2/3">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Routing Number
            </span>
            <p className="mt-1 text-base font-medium text-miru-dark-purple-1000">
              {routingNumber || "-"}
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Account Number
            </span>
            <p className="mt-1 text-base font-medium text-miru-dark-purple-1000">
              {accountNumber || "-"}
            </p>
          </div>
        </div>
        <div className="mt-6 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Account Type
            </span>
            <p className="mt-1 text-base font-medium text-miru-dark-purple-1000">
              {accountType || "-"}
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Bank Name
            </span>
            <p className="mt-1 text-base font-medium text-miru-dark-purple-1000">
              {bankName || "-"}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default BankDetails;
