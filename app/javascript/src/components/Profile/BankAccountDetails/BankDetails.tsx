import React, { useEffect } from "react";

import { X } from "phosphor-react";
import { isEmpty } from "ramda";

import wiseApi from "apis/wise";

import AddressDetails from "./AddressDetails";
import BankDetailInput from "./BillingDetailInput";

/* eslint-disable @typescript-eslint/no-var-requires */
const Shield = require("../../../../../assets/images/shield.svg");

const BankDetails = ({
  bankRequirements,
  firstName, setFirstName,
  lastName, setLastName,
  recipientDetails, setRecipientDetails,
  validRecipientDetails, setValidRecipientDetails,
  setBankDetailsModal, submitBankDetails
}) => {
  useEffect(() => {
    setRecipientDetails({ ...recipientDetails, type: bankRequirements[0]["type"] });
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

  const handleBankDetails = (key, value, fieldDetails) => {
    const validationAsync = fieldDetails["validationAsync"];

    if (validationAsync) {
      const url = `${validationAsync.url}?${validationAsync.params[0]["key"]}=${value}`;
      wiseApi.validateAccountDetail(url)
      /* eslint-disable @typescript-eslint/no-unused-vars */
        .then(_response => {
          updateDetails(true, key, value);
        })
        .catch(error => {
          if (error.response.status == 400) {
            updateDetails(false, key, value);
          }
        });
    } else if (fieldDetails["validationRegexp"]) {
      value.match(new RegExp(fieldDetails["validationRegexp"])) ? updateDetails(true, key, value) : updateDetails(false, key, value);
    } else {
      updateDetails(true, key, value);
    }
  };

  const handleAddressDetails = (key, value, fieldDetails) => {
    if (fieldDetails["validationRegexp"]) {
      value.match(new RegExp(fieldDetails["validationRegexp"])) ? updateAddressDetails(true, key, value) : updateAddressDetails(false, key, value);
    } else {
      updateAddressDetails(true, key, value);
    }
  };

  const isFormValid = Object.values(validRecipientDetails["details"]).every(value => value) &&
    Object.values(validRecipientDetails["details"]["address"]).every(value => value) && !isEmpty(firstName) && !isEmpty(lastName);

  return (
    <>
      <div
        className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
      >
        <div className="relative w-auto my-6 mx-auto max-w-sm">
          {/*content*/}
          <div className="rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 pb-2 rounded-t">
              <h3 className="text-sm font-semibold">
                Enter Bank Details
              </h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-1 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={() => setBankDetailsModal(false)}
              >
                <X size={12} />
              </button>
            </div>
            {/*Info*/}
            <div className="mx-5 px-5 py-3 bg-gray-100 text-xs inline-flex">
              <img className="h-4 w-4" src={Shield} />
              <p className="mx-2 text-slate-500">
                We don't store your bank details on our servers to ensure security of your information
              </p>
            </div>
            {/*body*/}
            <div className="relative px-5 py-2 flex-auto text-xs">
              <label className="text-xs">Name</label>
              <div className="inline-flex w-full my-2">
                <input
                  name="firstName"
                  value={firstName}
                  className="rounded-sm mr-1 p-1 bg-gray-100 w-2/4 text-xs"
                  placeholder="First name"
                  onChange={({ target: { value } }) => setFirstName(value)}
                />
                <input
                  name="lastName"
                  value={lastName}
                  className="rounded-sm ml-1 p-1 bg-gray-100 w-2/4 text-xs"
                  placeholder="Last name"
                  onChange={({ target: { value } }) => setLastName(value)}
                />
              </div>
              {
                bankRequirements[0]["fields"].map(field =>
                  <BankDetailInput
                    field={field}
                    key={field["name"]}
                    recipientDetails={recipientDetails}
                    handleBankDetails={handleBankDetails}
                  />
                )
              }
              <AddressDetails
                fields={bankRequirements[0]["addressFields"]}
                recipientDetails={recipientDetails}
                handleAddressDetails={handleAddressDetails}
                handleBankDetails={handleBankDetails}
              />
            </div>
            {/*footer*/}
            <div className="flex items-center justify-center px-5 rounded-b text-white font-bold text-sm">
              <button
                disabled={!isFormValid}
                className={
                  `w-full background-transparent uppercase rounded-md px-6 py-2 outline-none mb-3 ease-linear transition-all duration-150 ${isFormValid ? "bg-miru-han-purple-1000" : "bg-gray-200"}`
                }
                type="button"
                onClick={() => submitBankDetails()}
              >
                Submit Bank Details
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default BankDetails;
