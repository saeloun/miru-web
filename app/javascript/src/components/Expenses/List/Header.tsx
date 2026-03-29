import React from "react";

import { UnifiedSearch } from "../../ui/enhanced-search";
import { useUserContext } from "context/UserContext";
import { currencyFormat } from "helpers";
import { PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const SearchDataRow = ({ item }) => {
  const { company } = useUserContext();
  const navigate = useNavigate();

  const handleClick = item => {
    navigate(`/expenses/${item.value}`);
  };

  return (
    <div
      className="flex cursor-pointer items-center p-3 last:border-b-0 hover:bg-muted"
      onClick={() => handleClick(item)}
    >
      <span className="w-4/12 truncate whitespace-nowrap text-left text-base font-normal tracking-wider text-foreground">
        {item.label}
      </span>
      <span className="w-4/12 truncate whitespace-nowrap text-center text-base font-normal tracking-wider text-foreground">
        {item.date}
      </span>
      <span className="w-4/12 truncate whitespace-nowrap text-right text-base font-normal tracking-wider text-foreground">
        {currencyFormat(company.base_currency, item.amount)}
      </span>
    </div>
  );
};

const Header = ({
  setShowAddExpenseModal,
  fetchSearchResults,
  clearSearch,
}) => {
  const navigate = useNavigate();

  // Convert fetchSearchResults to return proper SearchItem format
  const searchAction = async (query: string) => {
    const results = await fetchSearchResults(query, true);

    // Transform results to match SearchItem interface
    return (
      results?.map(expense => ({
        id: expense.value || expense.id,
        label: expense.label || expense.name,
        type: "expense" as const,
        date: expense.date,
        amount: expense.amount,
        subtitle: expense.category,
        ...expense,
      })) || []
    );
  };

  const handleSelect = expense => {
    navigate(`/expenses/${expense.id}`);
  };

  return (
    <div className="mt-6 mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="header__title hidden lg:inline" data-cy="header__invoices">
        Expenses
      </h2>
      <UnifiedSearch
        searchAction={searchAction}
        placeholder="Search expenses..."
        onSelect={handleSelect}
        renderItem={item => <SearchDataRow item={item} />}
        clearSearch={clearSearch}
        handleEnter={fetchSearchResults}
        className="w-full sm:w-64"
        variant="input"
        size="md"
        minSearchLength={1}
      />
      {/* Todo: Uncomment when filter functionality is added
        <Button className="relative ml-7" style="ternary">
          <FilterIcon color="#5E58F1" size={16} />
        </Button>
        */}

      <Button
        className="ml-0 flex w-full items-center justify-center px-2 py-2 sm:ml-2 sm:w-auto lg:ml-0 lg:px-4"
        style="secondary"
        onClick={() => setShowAddExpenseModal(true)}
      >
        <PlusIcon size={16} weight="bold" />
        <span className="ml-2 hidden text-base font-medium tracking-widest lg:inline-block">
          Add Expense
        </span>
      </Button>
    </div>
  );
};

export default Header;
