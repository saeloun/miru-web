import React from "react";

import { currencyFormat } from "helpers";
import { PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

import AutoSearch from "common/AutoSearch";
import { useUserContext } from "context/UserContext";

const SearchDataRow = ({ item }) => {
  const { company } = useUserContext();
  const navigate = useNavigate();

  const handleClick = item => {
    navigate(`/expenses/${item.value}`);
  };

  return (
    <div
      className="flex cursor-pointer items-center p-3 last:border-b-0 hover:bg-miru-gray-100"
      onClick={() => handleClick(item)}
    >
      <span className="w-4/12 truncate whitespace-nowrap text-left text-base font-normal tracking-wider text-miru-dark-purple-1000">
        {item.label}
      </span>
      <span className="w-4/12 truncate whitespace-nowrap text-center text-base font-normal tracking-wider text-miru-dark-purple-1000">
        {item.date}
      </span>
      <span className="w-4/12 truncate whitespace-nowrap text-right text-base font-normal tracking-wider text-miru-dark-purple-1000">
        {currencyFormat(company.base_currency, item.amount)}
      </span>
    </div>
  );
};

const Header = ({
  setShowAddExpenseModal,
  fetchSearchResults,
  clearSearch,
}) => (
  <div className="mt-6 mb-3 flex flex-wrap items-center justify-between">
    <h2 className="header__title hidden lg:inline" data-cy="header__invoices">
      Expenses
    </h2>
    <AutoSearch
      SearchDataRow={SearchDataRow}
      clearSearch={clearSearch}
      handleEnter={fetchSearchResults}
      searchAction={fetchSearchResults}
    />
    {/* Todo: Uncomment when filter functionality is added
      <Button className="relative ml-7" style="ternary">
        <FilterIcon color="#5B34EA" size={16} />
      </Button>
      */}
    <div className="flex justify-end">
      <Button
        className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4"
        style="secondary"
        onClick={() => setShowAddExpenseModal(true)}
      >
        <PlusIcon size={16} weight="bold" />
        <span className="ml-2 hidden text-base font-medium tracking-widest lg:inline-block">
          Add Expense
        </span>
      </Button>
    </div>
  </div>
);

export default Header;
