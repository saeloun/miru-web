import React, { useState, useEffect } from "react";

import { bankFieldValidationRequirements, separateAddressFields } from "helpers";
import { isEmpty } from "ramda";

import profilesApi from "apis/profiles";
import wiseApi from "apis/wise";
import Loader from "common/Loader";
import { sendGAPageView } from "utils/googleAnalytics";

import BankDetails from "./BankDetails";
import BankInfo from "./BankInfo";
import CurrencyDropdown from "./CurrencyDropdown";

import Header from "../Header";

const BankAccountDetails = () => {
  const [isUpdate, setIsUpdate] = useState<boolean>();
  const [billingDetails, setBillingDetails] = useState<any>({});
  const [currencies, setCurrencies] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<any>();
  const [showBankDetailsModal, setBankDetailsModal] = useState<boolean>(false);
  const [bankRequirements, setBankRequirements] = useState<any>();
  const [recipientDetails, setRecipientDetails] = useState<any>({ details: { address: {} } });
  const [validRecipientDetails, setValidRecipientDetails] = useState<any>({ details: { address: {} } });

  const [firstName, setFirstName] = useState<any>();
  const [lastName, setLastName] = useState<any>();

  useEffect(() => {
    sendGAPageView();
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    try {
      setIsLoading(true);
      const response = await profilesApi.get();
      setBillingDetails(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRecipient = async (payload) => {
    try {
      const response = await wiseApi.createRecipient(payload);
      const billingResponse = await profilesApi.post(response.data);
      setBillingDetails(billingResponse.data);
    } catch (_error) {
      setBankDetailsModal(true);
      throw new Error("Error while creating recipient");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecipient = async (payload) => {
    try {
      const response = await wiseApi.updateRecipient(payload);
      const billingResponse = await profilesApi.put(billingDetails.id, response.data);
      setBillingDetails(billingResponse.data);
      setRecipientDetails(response.data);
    } catch (_error) {
      setBankDetailsModal(true);
      throw new Error("Error while creating recipient");
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Try to remove duplicate code as much as possible and optimize
  const fetchAccountRequirements = async (sourceCurrency, targetCurrency, isUpdate = false) => {
    try {
      setIsLoading(true);
      const response = await wiseApi.fetchAccountRequirements(sourceCurrency, targetCurrency);
      const data = response.data;
      const validRecipientDetails = bankFieldValidationRequirements(data, isUpdate);
      setValidRecipientDetails(validRecipientDetails);
      if (!isUpdate) {
        setRecipientDetails({ details: { address: {} } });
      }
      const fields = data.map(requirement => separateAddressFields(requirement));
      setBankRequirements(fields);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitBankDetails = () => {
    const payload = {
      ...recipientDetails,
      accountHolderName: `${firstName} ${lastName}`,
      currency: currency || billingDetails.targetCurrency
    };
    setIsLoading(true);
    setBankDetailsModal(false);
    isUpdate ? updateRecipient(payload) : createRecipient(payload);
  };

  const renderBankDetails = (billingDetails) => {
    if (isEmpty(billingDetails)) {
      return (<></>);
    } else if (!billingDetails.recipientId) {
      return (
        <CurrencyDropdown
          currencies={currencies}
          setCurrencies={setCurrencies}
          currency={currency}
          setCurrency={setCurrency}
          setIsLoading={setIsLoading}
          setBankDetailsModal={setBankDetailsModal}
          fetchAccountRequirements={fetchAccountRequirements}
        />
      );
    } else {
      return (
        <BankInfo
          recipientId={billingDetails.recipientId}
          setBankDetailsModal={setBankDetailsModal}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setRecipientDetails={setRecipientDetails}
          fetchAccountRequirements={fetchAccountRequirements}
          sourceCurrency={billingDetails.sourceCurrency}
          targetCurrency={billingDetails.targetCurrency}
          setIsUpdate={setIsUpdate}
          setIsLoading={setIsLoading}
        />
      );
    }
  };

  return (
    <div className="flex flex-col w-4/5 text-sm">
      <Header
        title={"Bank Account Details"}
        subTitle={"Settings to receive payment from your employer"}
      />
      <div className="py-10 pl-10 mt-4 bg-miru-gray-100 h-screen inline-flex">
        {isLoading && <Loader message={"Loading..."} /> }
        <div className="w-26 h-12 float-left my-2">Bank Account Details</div>
        { renderBankDetails(billingDetails) }
        {
          showBankDetailsModal &&
          <BankDetails
            setBankDetailsModal={setBankDetailsModal}
            bankRequirements={bankRequirements}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            recipientDetails={recipientDetails}
            setRecipientDetails={setRecipientDetails}
            validRecipientDetails={validRecipientDetails}
            setValidRecipientDetails={setValidRecipientDetails}
            submitBankDetails={submitBankDetails}
          />
        }
      </div>
    </div>
  );
};

export default BankAccountDetails;
