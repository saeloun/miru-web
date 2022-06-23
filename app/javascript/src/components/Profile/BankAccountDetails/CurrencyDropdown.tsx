import React, { useEffect } from "react";

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
    <div className="block px-5 w-4/5 text-sm">
      <div className="my-2">
        <label className="text-xs">Currency</label>
      </div>
      <div className="inline-flex w-full">
        <select
          className="w-2/4 form-select appearance-none block bg-white rounded transition  ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          onChange={ ({ target: { value } }) => setCurrency(value) }
        >
          <option value={null}>Select Currency</option>
          { currencies.map(option => (<option value={option.value} key={option.value}>{option.label}</option>)) }
        </select>
        <button
          className={`mx-3 py-1 w-2/4 border rounded-md text-white uppercase ${currency ? "bg-miru-han-purple-1000" : "bg-gray-200"} `}
          onClick={ () => setBankDetailsModal(true) }
          disabled={!currency}
        >
          Enter Bank Details
        </button>
      </div>
    </div>
  );
};

export default CurrencyDropdown;
