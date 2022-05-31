import React, { useEffect } from "react";

import wiseApi from "apis/wise";

const BankInfo = ({
  recipientId,
  sourceCurrency, targetCurrency,
  fetchAccountRequirements,
  setBankDetailsModal,
  setFirstName, setLastName,
  setRecipientDetails, setIsUpdate
}) => {

  useEffect(() => {
    wiseApi.fetchRecipient(recipientId)
      .then(response => {
        const name = response.data["accountHolderName"].split(" ");

        setRecipientDetails(response.data);
        setFirstName(name.shift());
        setLastName(name.join(" "));
        setIsUpdate(true);
      })
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    fetchAccountRequirements(sourceCurrency, targetCurrency, true);
  }, []);

  return (
    <div className="mx-2 w-5/6 h-12 px-8 py-2 bg-gray-200">
      <p onClick={ () => setBankDetailsModal(true) }>You have already submitted your bank details. View or update bank details</p>
    </div>
  );
};

export default BankInfo;
