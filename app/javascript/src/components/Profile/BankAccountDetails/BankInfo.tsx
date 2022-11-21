import React, { useEffect } from "react";

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

  const fetchRecipientDetails = async (recipientId) => {
    try {
      setIsLoading(true);
      const response = await wiseApi.fetchRecipient(recipientId);
      const name = response.data["accountHolderName"].split(" ");
      setRecipientDetails(response.data);
      setFirstName(name.shift());
      setLastName(name.join(" "));
      setIsUpdate(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-2 w-5/8 h-12 px-8 py-3.5 bg-gray-200 flex justify-center">
      <p>You have already submitted your bank details.</p>
      <button
        className="bg-transparent text-miru-han-purple-1000 font-semibold underline mx-1"
        onClick={() => setBankDetailsModal(true)}
      >
        View or update bank details
      </button>
    </div>
  );
};

export default BankInfo;
