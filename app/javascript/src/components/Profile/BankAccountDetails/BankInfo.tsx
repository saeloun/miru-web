import React, { useEffect } from "react";

import Logger from "js-logger";

import wiseApi from "apis/wise";

const BankInfo = ({
  recipientId,
  sourceCurrency,
  targetCurrency,
  fetchAccountRequirements,
  setBankDetailsModal,
  setIsLoading,
  setFirstName,
  setLastName,
  setRecipientDetails,
  setIsUpdate,
}) => {
  useEffect(() => {
    fetchRecipientDetails(recipientId);
  }, []);

  useEffect(() => {
    fetchAccountRequirements(sourceCurrency, targetCurrency, true);
  }, []);

  const fetchRecipientDetails = async recipientId => {
    try {
      setIsLoading(true);
      const response = await wiseApi.fetchRecipient(recipientId);
      const name = response.data["accountHolderName"].split(" ");
      setRecipientDetails(response.data);
      setFirstName(name.shift());
      setLastName(name.join(" "));
      setIsUpdate(true);
    } catch (error) {
      Logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-5/8 mx-2 flex h-12 justify-center bg-gray-200 px-8 py-3.5">
      <p>You have already submitted your bank details.</p>
      <button
        className="mx-1 bg-transparent font-semibold text-miru-han-purple-1000 underline"
        onClick={() => setBankDetailsModal(true)}
      >
        View or update bank details
      </button>
    </div>
  );
};

export default BankInfo;
