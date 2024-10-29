import React from "react";

import { CustomInputText } from "common/CustomInputText";
import { ErrorSpan } from "common/ErrorSpan";
import Loader from "common/Loader/index";

const BankDetailsForm = ({
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
}) =>
  isLoading ? (
    <Loader />
  ) : (
    <div className="mt-10 flex flex-col lg:mt-0 lg:w-2/3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex w-full flex-col">
          <CustomInputText
            id="routing_number"
            inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
            label="Routing Number"
            labelClassName="cursor-pointer"
            name="routing_number"
            type="text"
            value={routingNumber}
            wrapperClassName="w-full mb-6 lg:mb-0"
            onChange={e => setRoutingNumber(e.target.value)}
          />
          <ErrorSpan message={errDetails.routingNumberErr} />
        </div>
        <div className="flex w-full flex-col">
          <CustomInputText
            id="account_number"
            inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
            label="Account Number"
            labelClassName="cursor-pointer"
            name="account_number"
            type="text"
            value={accountNumber}
            wrapperClassName="w-full mb-6 lg:mb-0"
            onChange={e => setAccountNumber(e.target.value)}
          />
          <ErrorSpan message={errDetails.accountNumberErr} />
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between gap-4">
        <div className="flex w-full flex-col">
          <CustomInputText
            id="account_type"
            inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
            label="Account Type"
            labelClassName="cursor-pointer"
            name="account_type"
            type="text"
            value={accountType}
            wrapperClassName="w-full mb-6 lg:mb-0"
            onChange={e => setAccountType(e.target.value)}
          />
          <ErrorSpan message={errDetails.accountTypeErr} />
        </div>
        <div className="flex w-full flex-col">
          <CustomInputText
            id="bank_name"
            inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
            label="Bank Name"
            labelClassName="cursor-pointer"
            name="bank_name"
            type="text"
            value={bankName}
            wrapperClassName="w-full mb-6 lg:mb-0"
            onChange={e => setBankName(e.target.value)}
          />
          <ErrorSpan message={errDetails.bankNameErr} />
        </div>
      </div>
    </div>
  );

export default BankDetailsForm;
