import React, { useEffect, useState } from "react";

import { useDebounce } from "helpers";
import { FilterIcon, SearchIcon, PlusIcon, XIcon } from "miruIcons";
import { Link } from "react-router-dom";

import invoicesApi from "apis/invoices";
import { ApiStatus as InvoiceStatus } from "constants/index";

import SearchDropdown from "./InvoiceSearch/SearchDropdown";

const Header = ({ setIsFilterVisible, params, setParams, filterParamsStr }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  let appliedFilterCount = (filterParamsStr.match(/&/g) || []).length;
  filterParamsStr.includes("custom") &&
    (appliedFilterCount = appliedFilterCount - 2);

  useEffect(() => {
    if (searchQuery) {
      fetchSearchinvoices(debouncedSearchQuery);
    } else {
      setSearchResult([]);
      setStatus(InvoiceStatus.IDLE);
    }
  }, [debouncedSearchQuery]);

  const fetchSearchinvoices = async debouncedSearchQuery => {
    const SEARCH_SIZE = 5;
    const searchParams = `invoices_per_page=${SEARCH_SIZE}&page=1&query=${debouncedSearchQuery}`;
    setStatus(InvoiceStatus.LOADING);
    try {
      const {
        data: { invoices },
      } = await invoicesApi.get(searchParams);
      setSearchResult(invoices);
      setStatus(InvoiceStatus.SUCCESS);
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  const onSearchClear = () => {
    setSearchQuery("");
    setParams({ ...params, query: "" });
  };

  const onKeydownHandler = e => {
    if (e.key === "Enter") {
      setParams({ ...params, query: searchQuery });
    }
  };

  return (
    <div className="mt-6 mb-3 flex h-40 flex-col flex-wrap items-center justify-between lg:h-auto lg:flex-row">
      <h2 className="header__title" data-cy="header__invoices">
        Invoices
      </h2>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper relative">
          <div>
            <input
              className="header__searchInput"
              data-cy="search-invoice"
              placeholder="Search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => onKeydownHandler(e)}
            />
            <button className=" absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 ">
              {searchQuery ? (
                <XIcon size={12} onClick={onSearchClear} />
              ) : (
                <SearchIcon size={12} />
              )}
            </button>
            <SearchDropdown
              display={params.query !== searchQuery}
              list={searchResult}
              status={status}
            />
          </div>
        </div>
        <button
          className="relative ml-7"
          onClick={() => setIsFilterVisible(true)}
        >
          {appliedFilterCount > 0 && (
            <span className="absolute bottom-2 left-2 mr-7 flex h-4 w-4 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
              {appliedFilterCount}
            </span>
          )}
          <FilterIcon
            color={filterParamsStr ? "#5B34EA" : "#303A4B"}
            size={16}
          />
        </button>
      </div>
      <div className="flex">
        <Link className="header__button" to="/invoices/generate" type="button">
          <PlusIcon size={16} weight="fill" />
          <span className="ml-2 inline-block" data-cy="new-invoice-button">
            NEW INVOICE
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Header;
