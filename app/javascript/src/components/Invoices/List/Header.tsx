import React, { useEffect, useState } from "react";

import { useDebounce } from "helpers";
import { PlusIcon, FilterIcon, XIcon, SearchIcon } from "miruIcons";
import { Link } from "react-router-dom";

import invoicesApi from "apis/invoices";
import { ApiStatus as InvoiceStatus, LocalStorageKeys } from "constants/index";

import SearchDropdown from "./InvoiceSearch/SearchDropdown";

const Header = ({
  setIsFilterVisible,
  params,
  setParams,
  filterParamsStr,
  isDesktop,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(params.query || "");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [expandSearchBox, setExpandSearchBox] = useState<boolean>(false);
  const [isShrinkingSearchBox, setIsShrinkingSearchBox] =
    useState<boolean>(false);
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

  useEffect(() => {
    const pageContainerEl = document.getElementById("invoice-list-page");

    if (pageContainerEl) {
      if (expandSearchBox || searchQuery) {
        pageContainerEl.classList.add("h-90v", "overflow-hidden");
      } else {
        pageContainerEl.classList.remove("h-90v", "overflow-hidden");
      }
    }

    return () => {
      if (pageContainerEl) {
        pageContainerEl.classList.remove("h-90v", "overflow-hidden");
      }
    };
  }, [expandSearchBox, searchQuery]);

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
    window.localStorage.setItem(LocalStorageKeys.INVOICE_SEARCH_PARAM, "");
    setParams({ ...params, query: "" });
  };

  const onKeydownHandler = e => {
    if (e.key === "Enter") {
      window.localStorage.setItem(
        LocalStorageKeys.INVOICE_SEARCH_PARAM,
        searchQuery
      );
      setParams({ ...params, query: searchQuery });
    }
  };

  const onSearchBlur = () => {
    setExpandSearchBox(false);
    setIsShrinkingSearchBox(true);
    const timer = setTimeout(() => {
      setIsShrinkingSearchBox(false);
      clearTimeout(timer);
    }, 300);
  };

  return (
    <div className="relative mt-6 mb-3 flex flex-wrap items-center justify-between md:justify-start lg:justify-between">
      {isDesktop && <h2 className="header__title">Invoices</h2>}
      {expandSearchBox || searchQuery ? (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-50" />
      ) : null}
      <div className="flex w-10/12 md:w-11/12 lg:w-1/3">
        <div
          className={`${
            expandSearchBox || searchQuery
              ? "absolute z-30 mb-2 w-full scale-100 transform transition-transform duration-300"
              : "relative w-11/12 scale-95 transform transition-transform duration-300"
          } ${isShrinkingSearchBox ? "scale-95" : ""}`}
        >
          <input
            className="outline-none w-full rounded-full border-miru-gray-1000 bg-miru-gray-100 py-3 px-3 text-sm font-medium leading-5 focus:border focus:ring-1 focus:ring-miru-gray-1000"
            placeholder="Search"
            type="text"
            value={searchQuery}
            onBlur={onSearchBlur}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setExpandSearchBox(true)}
            onKeyDown={e => onKeydownHandler(e)}
          />
          <button className="absolute inset-y-0 right-3 flex cursor-pointer items-center">
            {searchQuery || expandSearchBox ? (
              <XIcon
                color="#CDD6DF"
                size={16}
                weight="bold"
                onClick={onSearchClear}
              />
            ) : (
              <SearchIcon
                className="text-miru-gray-1000"
                size={16}
                weight="bold"
              />
            )}
          </button>
          <SearchDropdown
            display={params.query !== searchQuery}
            list={searchResult}
            status={status}
          />
        </div>
        <button
          className="relative ml-2 h-10 w-10 rounded p-3 hover:bg-miru-gray-1000"
          onClick={() => setIsFilterVisible(true)}
        >
          {appliedFilterCount > 0 && (
            <span className="absolute bottom-5 left-5  flex h-4 w-4 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
              {appliedFilterCount}
            </span>
          )}
          <FilterIcon
            className="hover:bg-miru-gray-1000"
            color="#5B34EA"
            size={16}
            weight="bold"
          />
        </button>
      </div>
      <div className="flex">
        <Link
          className="header__button border md:p-3"
          to="/invoices/generate"
          type="button"
        >
          <PlusIcon size={16} weight="bold" />
          {isDesktop && (
            <span className="ml-2 inline-block tracking-normal">
              NEW INVOICE
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Header;
