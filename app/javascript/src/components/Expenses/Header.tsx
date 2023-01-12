import React, { useState } from "react";

import { FilterIcon, SearchIcon, PlusIcon, XIcon } from "miruIcons";
import { Link } from "react-router-dom";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <div className="mt-6 mb-3 flex h-40 flex-col flex-wrap items-center justify-between lg:h-auto lg:flex-row">
      <div className="flex">
        <h2 className="header__title" data-cy="header__invoices">
          Expenses
        </h2>
        <button className="relative ml-7">
          {/* {appliedFilterCount > 0 && (
            <span className="absolute bottom-2 left-2 mr-7 flex h-4 w-4 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
              {appliedFilterCount}
            </span>
          )} */}
          <FilterIcon color="#5B34EA" size={16} />
        </button>
      </div>
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
      <div className="flex">
        <Link className="header__button" to="/invoices/generate" type="button">
          <PlusIcon size={16} weight="fill" />
          <span className="ml-2 inline-block" data-cy="new-invoice-button">
            Add Expense
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Header;
