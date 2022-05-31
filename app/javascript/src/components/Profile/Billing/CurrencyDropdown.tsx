import React, { useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import wiseApi from "apis/wise";
import getSymbolFromCurrency from "currency-symbol-map";

const CurrencyDropdown = ({
  currencies, setCurrencies,
  currency, setCurrency,
  setIsLoading, setBankDetailsModal,
  fetchAccountRequirements
}) => {

  useEffect(() => {
    setIsLoading(true);
    setAuthHeaders();
    registerIntercepts();
    wiseApi.fetchCurrencies().
      then(response => response.data).
      then(data => data.map(currency => ({ label: `${currency} (${getSymbolFromCurrency(currency)})`, value: currency }))).
      then(options => {
        setCurrencies(options);
        setIsLoading(false);
      }).
      catch(error => console.error(error));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (currency) {
      fetchAccountRequirements("USD", currency);
    }
  }, [currency]);

  return (
    <div className="flex justify-center float-right px-5 w-4/5 text-sm">
      <label className="text-xs">Currency</label>
      <select
        className="w-2/4 form-select appearance-none block bg-white rounded transition  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        onChange={ ({ target: { value } }) => setCurrency(value) }
      >
        <option value={null}>Select Currency</option>
        { currencies.map(option => (<option value={option.value} key={option.value}>{option.label}</option>)) }
      </select>
      {
        currency ? (
          <button
            className="mx-3 py-1 w-2/4 border rounded-md bg-miru-han-purple-1000 text-white"
            onClick={ () => setBankDetailsModal(true) }
          >
            Enter Bank Details
          </button>
        ) : (
          <button className="mx-3 py-1 w-2/4 border rounded-md bg-gray-300 text-white" disabled>Enter Bank Details</button>
        )
      }
    </div>
  );
};

export default CurrencyDropdown;
