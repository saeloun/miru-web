import React, { useEffect } from "react";

import getSymbolFromCurrency from "currency-symbol-map";
import Logger from "js-logger";

import wiseApi from "apis/wise";

const CurrencyDropdown = ({
  currencies,
  setCurrencies,
  currency,
  setCurrency,
  setIsLoading,
  setBankDetailsModal,
  fetchAccountRequirements,
}) => {
  useEffect(() => {
    fetchCurrencyList();
  }, []);

  useEffect(() => {
    if (currency) {
      fetchAccountRequirements("USD", currency);
    }
  }, [currency]);

  const fetchCurrencyList = async () => {
    try {
      setIsLoading(true);
      const response = await wiseApi.fetchCurrencies();
      const list = response.data.map(currency => ({
        label: `${currency} (${getSymbolFromCurrency(currency)})`,
        value: currency,
      }));
      setCurrencies(list);
    } catch (error) {
      Logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="block w-4/5 px-5 text-sm">
      <div className="my-2">
        <label className="text-xs">Currency</label>
      </div>
      <div className="inline-flex w-full">
        <select
          className="form-select focus:outline-none block w-2/4 appearance-none rounded bg-white  transition ease-in-out focus:border-blue-600 focus:bg-white focus:text-gray-700"
          onChange={({ target: { value } }) => setCurrency(value)}
        >
          <option value={null}>Select Currency</option>
          {currencies.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          disabled={!currency}
          className={`mx-3 w-2/4 rounded-md border py-1 uppercase text-white ${
            currency ? "bg-miru-han-purple-1000" : "bg-gray-200"
          } `}
          onClick={() => setBankDetailsModal(true)}
        >
          Enter Bank Details
        </button>
      </div>
    </div>
  );
};

export default CurrencyDropdown;
