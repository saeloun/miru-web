import { ApiStatus as InvoiceStatus, LocalStorageKeys } from "constants/index";

import React, { useEffect, useState, useRef } from "react";

import invoicesApi from "apis/invoices";
import { useDebounce, useOutsideClick } from "helpers";
import { PlusIcon, FilterIcon, XIcon, SearchIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

import SearchDropdown from "./InvoiceSearch/SearchDropdown";

const Header = ({
  setIsFilterVisible,
  params,
  setParams,
  filterParamsStr,
  isDesktop,
  handleOverlayVisibility,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(params.query || "");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [expandSearchBox, setExpandSearchBox] = useState<boolean>(false);
  const [isShrinkingSearchBox, setIsShrinkingSearchBox] =
    useState<boolean>(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  let appliedFilterCount = (filterParamsStr.match(/&/g) || []).length;
  if (filterParamsStr.includes("custom")) {
    appliedFilterCount = appliedFilterCount - 2;
  }

  const searchRef = useRef(null);
  const navigate = useNavigate();

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

    if (pageContainerEl && !isDesktop) {
      if (expandSearchBox || searchQuery) {
        pageContainerEl.classList.add("h-90v", "overflow-hidden");
        handleOverlayVisibility(true);
      } else {
        pageContainerEl.classList.remove("h-90v", "overflow-hidden");
        handleOverlayVisibility(false);
      }
    }

    return () => {
      if (pageContainerEl) {
        pageContainerEl.classList.remove("h-90v", "overflow-hidden");
        handleOverlayVisibility(false);
      }
    };
  }, [expandSearchBox, searchQuery, isDesktop]);

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

  useOutsideClick(searchRef, () => {
    onSearchClear();
  });

  return (
    <div className="relative mt-6 mb-3 flex flex-wrap items-center justify-between md:justify-start lg:justify-between">
      {isDesktop && <h2 className="header__title">Invoices</h2>}
      {isDesktop ? (
        <div className="flex w-10/12 lg:w-1/3">
          <div className="relative w-11/12">
            <input
              className="outline-none w-full rounded-full border-miru-gray-1000 bg-miru-gray-100 py-2 px-3 text-sm font-medium leading-5 focus:border focus:ring-1 focus:ring-miru-gray-1000"
              placeholder="Search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => onKeydownHandler(e)}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              {searchQuery ? (
                <XIcon size={12} weight="bold" onClick={onSearchClear} />
              ) : (
                <SearchIcon
                  className="text-miru-gray-1000"
                  size={16}
                  weight="bold"
                />
              )}
            </div>
            <SearchDropdown
              display={params.query !== searchQuery}
              list={searchResult}
              status={status}
            />
          </div>
          <Button
            className="relative ml-3"
            style="ternary"
            onClick={() => setIsFilterVisible(true)}
          >
            {appliedFilterCount > 0 && (
              <span className="absolute bottom-5 left-5  flex h-4 w-4 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                {appliedFilterCount}
              </span>
            )}
            <FilterIcon color="#5B34EA" size={16} weight="bold" />
          </Button>
        </div>
      ) : (
        <div className="flex w-10/12 md:w-11/12 lg:w-1/3">
          <div
            className={`${
              expandSearchBox || searchQuery
                ? "absolute z-max mb-2 w-full scale-100 transform transition-transform duration-300"
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
            <div className="absolute inset-y-0 right-3 flex items-center">
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
            </div>
            <SearchDropdown
              display={params.query !== searchQuery}
              list={searchResult}
              searchRef={searchRef}
              status={status}
            />
          </div>
          <Button
            className="relative ml-3"
            style="ternary"
            onClick={() => setIsFilterVisible(true)}
          >
            {appliedFilterCount > 0 && (
              <span className="absolute bottom-5 left-5  flex h-4 w-4 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                {appliedFilterCount}
              </span>
            )}
            <FilterIcon color="#5B34EA" size={16} weight="bold" />
          </Button>
        </div>
      )}
      <Button
        className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4"
        style="secondary"
        onClick={() => navigate("/invoices/generate")}
      >
        <PlusIcon size={16} weight="bold" />
        <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
          New Invoice
        </span>
      </Button>
    </div>
  );
};

export default Header;
