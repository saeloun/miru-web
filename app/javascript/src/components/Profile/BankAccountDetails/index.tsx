import React, { useState, useEffect } from "react";

import {
  bankFieldValidationRequirements,
  separateAddressFields,
} from "helpers";
import Logger from "js-logger";
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
  const [bankDetailsModal, setBankDetailsModal] = useState<boolean>(false);
  const [bankRequirements, setBankRequirements] = useState<any>();
  const [recipientDetails, setRecipientDetails] = useState<any>({
    details: { address: {} },
  });

  const [validRecipientDetails, setValidRecipientDetails] = useState<any>({
    details: { address: {} },
  });

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
      Logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRecipient = async payload => {
    try {
      const response = await wiseApi.createRecipient(payload);
      const billingResponse = await profilesApi.post(response.data);
      setBillingDetails(billingResponse.data);
    } catch {
      setBankDetailsModal(true);
      throw new Error("Error while creating recipient");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecipient = async payload => {
    try {
      const response = await wiseApi.updateRecipient(payload);
      const billingResponse = await profilesApi.put(
        billingDetails.id,
        response.data
      );
      setBillingDetails(billingResponse.data);
      setRecipientDetails(response.data);
    } catch {
      setBankDetailsModal(true);
      throw new Error("Error while creating recipient");
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Try to remove duplicate code as much as possible and optimize
  const fetchAccountRequirements = async (
    sourceCurrency,
    targetCurrency,
    isUpdate = false
  ) => {
    try {
      setIsLoading(true);
      const response = await wiseApi.fetchAccountRequirements(
        sourceCurrency,
        targetCurrency
      );
      const data = response.data;
      const validRecipientDetails = bankFieldValidationRequirements(
        data,
        isUpdate
      );
      setValidRecipientDetails(validRecipientDetails);
      if (!isUpdate) {
        setRecipientDetails({ details: { address: {} } });
      }

      const fields = data.map(requirement =>
        separateAddressFields(requirement)
      );
      setBankRequirements(fields);
    } catch (error) {
      Logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitBankDetails = () => {
    const payload = {
      ...recipientDetails,
      accountHolderName: `${firstName} ${lastName}`,
      currency: currency || billingDetails.targetCurrency,
    };
    setIsLoading(true);
    setBankDetailsModal(false);
    isUpdate ? updateRecipient(payload) : createRecipient(payload);
  };

  const renderBankDetails = billingDetails => {
    if (isEmpty(billingDetails)) {
      return <div />;
    } else if (!billingDetails.recipientId) {
      return (
        <CurrencyDropdown
          currencies={currencies}
          currency={currency}
          fetchAccountRequirements={fetchAccountRequirements}
          setBankDetailsModal={setBankDetailsModal}
          setCurrencies={setCurrencies}
          setCurrency={setCurrency}
          setIsLoading={setIsLoading}
        />
      );
    }

    return (
      <BankInfo
        fetchAccountRequirements={fetchAccountRequirements}
        recipientId={billingDetails.recipientId}
        setBankDetailsModal={setBankDetailsModal}
        setFirstName={setFirstName}
        setIsLoading={setIsLoading}
        setIsUpdate={setIsUpdate}
        setLastName={setLastName}
        setRecipientDetails={setRecipientDetails}
        sourceCurrency={billingDetails.sourceCurrency}
        targetCurrency={billingDetails.targetCurrency}
      />
    );
  };

  return (
    <div className="flex w-4/5 flex-col text-sm">
      <Header
        subTitle="Settings to receive payment from your employer"
        title="Bank Account Details"
      />
      <div className="mt-4 inline-flex h-screen bg-miru-gray-100 py-10 pl-10">
        {isLoading && <Loader message="Loading..." />}
        <div className="float-left my-2 h-12 w-26">Bank Account Details</div>
        {renderBankDetails(billingDetails)}
        {bankDetailsModal && (
          <BankDetails
            bankRequirements={bankRequirements}
            firstName={firstName}
            lastName={lastName}
            recipientDetails={recipientDetails}
            setBankDetailsModal={setBankDetailsModal}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setRecipientDetails={setRecipientDetails}
            setValidRecipientDetails={setValidRecipientDetails}
            submitBankDetails={submitBankDetails}
            validRecipientDetails={validRecipientDetails}
          />
        )}
      </div>
    </div>
  );
};

export default BankAccountDetails;
