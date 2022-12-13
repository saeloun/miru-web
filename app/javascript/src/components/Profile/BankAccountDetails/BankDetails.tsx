import React, { useEffect } from "react";

import { XIcon } from "miruIcons";
import { isEmpty } from "ramda";

import wiseApi from "apis/wise";

import AddressDetails from "./AddressDetails";
import BankDetailInput from "./BillingDetailInput";

/* eslint-disable @typescript-eslint/no-var-requires */
const Shield = require("../../../../../assets/images/shield.svg");

const BankDetails = ({
  bankRequirements,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  recipientDetails,
  setRecipientDetails,
  validRecipientDetails,
  setValidRecipientDetails,
  setBankDetailsModal,
  submitBankDetails,
}) => {
  useEffect(() => {
    setRecipientDetails({
      ...recipientDetails,
      type: bankRequirements[0]["type"],
    });
  }, []);

  const updateDetails = (isValid, key, value) => {
    const valid = { ...validRecipientDetails };
    const details = { ...recipientDetails };

    valid["details"][`${key}`] = isValid;
    details["details"][`${key}`] = value;
    setRecipientDetails(details);
    setValidRecipientDetails(valid);
  };

  const updateAddressDetails = (isValid, key, value) => {
    const valid = { ...validRecipientDetails };
    const details = { ...recipientDetails };

    valid["details"]["address"][`${key}`] = isValid;
    details["details"]["address"][`${key}`] = value;
    setRecipientDetails(details);
    setValidRecipientDetails(valid);
  };

  const handleBankDetails = async (key, value, fieldDetails) => {
    const validationAsync = fieldDetails["validationAsync"];

    if (validationAsync) {
      try {
        const url = `${validationAsync.url}?${validationAsync.params[0]["key"]}=${value}`;
        await wiseApi.validateAccountDetail(url);
        updateDetails(true, key, value);
      } catch (error) {
        if (error.response.status == 400) {
          updateDetails(false, key, value);
        }
      }
    } else if (fieldDetails["validationRegexp"]) {
      value.match(new RegExp(fieldDetails["validationRegexp"]))
        ? updateDetails(true, key, value)
        : updateDetails(false, key, value);
    } else {
      updateDetails(true, key, value);
    }
  };

  const handleAddressDetails = (key, value, fieldDetails) => {
    if (fieldDetails["validationRegexp"]) {
      value.match(new RegExp(fieldDetails["validationRegexp"]))
        ? updateAddressDetails(true, key, value)
        : updateAddressDetails(false, key, value);
    } else {
      updateAddressDetails(true, key, value);
    }
  };

  const isFormValid =
    Object.values(validRecipientDetails["details"]).every(value => value) &&
    Object.values(validRecipientDetails["details"]["address"]).every(
      value => value
    ) &&
    !isEmpty(firstName) &&
    !isEmpty(lastName);

  return (
    <>
      <div className="overflow-XIcon-hidden outline-none focus:outline-none fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
        <div className="relative my-6 mx-auto w-auto max-w-sm">
          {/*content*/}
          <div className="outline-none focus:outline-none relative flex w-full flex-col rounded-lg bg-white shadow-lg">
            {/*header*/}
            <div className="flex items-start justify-between rounded-t p-5 pb-2">
              <h3 className="text-sm font-semibold">Enter Bank Details</h3>
              <button
                className="opacity-1 outline-none focus:outline-none float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black"
                onClick={() => setBankDetailsModal(false)}
              >
                <XIcon size={12} />
              </button>
            </div>
            {/*Info*/}
            <div className="mx-5 inline-flex bg-gray-100 px-5 py-3 text-xs">
              <img className="h-4 w-4" src={Shield} />
              <p className="text-slate-500 mx-2">
                We don't store your bank details on our servers to ensure
                security of your information
              </p>
            </div>
            {/*body*/}
            <div className="relative flex-auto px-5 py-2 text-xs">
              <label className="text-xs">Name</label>
              <div className="my-2 inline-flex w-full">
                <input
                  className="mr-1 w-2/4 rounded-sm bg-gray-100 p-1 text-xs"
                  name="firstName"
                  placeholder="First name"
                  value={firstName}
                  onChange={({ target: { value } }) => setFirstName(value)}
                />
                <input
                  className="ml-1 w-2/4 rounded-sm bg-gray-100 p-1 text-xs"
                  name="lastName"
                  placeholder="Last name"
                  value={lastName}
                  onChange={({ target: { value } }) => setLastName(value)}
                />
              </div>
              {bankRequirements[0]["fields"].map(field => (
                <BankDetailInput
                  field={field}
                  handleBankDetails={handleBankDetails}
                  key={field["name"]}
                  recipientDetails={recipientDetails}
                />
              ))}
              <AddressDetails
                fields={bankRequirements[0]["addressFields"]}
                handleAddressDetails={handleAddressDetails}
                handleBankDetails={handleBankDetails}
                recipientDetails={recipientDetails}
              />
            </div>
            {/*footer*/}
            <div className="flex items-center justify-center rounded-b px-5 text-sm font-bold text-white">
              <button
                disabled={!isFormValid}
                type="button"
                className={`background-transparent outline-none mb-3 w-full rounded-md px-6 py-2 uppercase transition-all duration-150 ease-linear ${
                  isFormValid ? "bg-miru-han-purple-1000" : "bg-gray-200"
                }`}
                onClick={() => submitBankDetails()}
              >
                Submit Bank Details
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black opacity-25" />
    </>
  );
};

export default BankDetails;
