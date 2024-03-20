import React, { useState } from "react";

import { SearchIcon, PlusIcon, XIcon } from "miruIcons";

const Header = ({ setShowAddExpenseModal }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <div className="mt-6 mb-3 flex flex-wrap items-center justify-between">
      <h2 className="header__title hidden lg:inline" data-cy="header__invoices">
        Expenses
      </h2>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper relative rounded-full">
          <div className="">
            <input
              className="header__searchInput rounded-full px-4"
              data-cy="search-invoice"
              placeholder="Search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className=" absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 ">
              {searchQuery ? <XIcon size={12} /> : <SearchIcon size={12} />}
            </button>
          </div>
        </div>
      </div>
      {/* Todo: Uncomment when filter functionality is added
      <Button className="relative ml-7" style="ternary">
        <FilterIcon color="#5B34EA" size={16} />
      </Button>
      */}
      <div className="flex">
        <button
          className="header__button"
          onClick={() => setShowAddExpenseModal(true)}
        >
          <PlusIcon size={16} weight="fill" />
          <span
            className="ml-2 hidden lg:inline-block"
            data-cy="new-invoice-button"
          >
            Add Expense
          </span>
        </button>
      </div>
    </div>
  );
};

export default Header;
