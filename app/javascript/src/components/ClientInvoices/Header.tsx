import { ApiStatus as InvoiceStatus, LocalStorageKeys } from "constants/index";

import React, { useEffect, useState } from "react";

import { clientApi } from "apis/api";
import { useUserContext } from "context/UserContext";
import { useDebounce } from "helpers";
import { XIcon, SearchIcon } from "miruIcons";

import SearchDropdown from "./InvoiceSearch/SearchDropdown";

const Header = ({ showSearch, params, setParams }) => {
  const { isDesktop, handleOverlayVisibility } = useUserContext();
  const [searchQuery, setSearchQuery] = useState<string>(params.query || "");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [expandSearchBox, setExpandSearchBox] = useState<boolean>(false);
  const [isShrinkingSearchBox, setIsShrinkingSearchBox] =
    useState<boolean>(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
      } = await clientApi.invoices(searchParams);
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
    <div className="relative mt-6 mb-3 flex flex-wrap items-center justify-center md:justify-start lg:justify-between">
      {isDesktop && <h2 className="header__title">Invoices</h2>}
      {showSearch >= 1 && (
        <>
          {isDesktop ? (
            <div className="flex w-10/12 lg:w-1/2">
              <div className="relative w-11/12">
                <input
                  className="outline-none w-full rounded-full border-miru-gray-1000 bg-miru-gray-100 py-2 px-3 text-sm font-medium leading-5 focus:border focus:ring-1 focus:ring-miru-gray-1000"
                  placeholder="Search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => onKeydownHandler(e)}
                />
                <button className="absolute inset-y-0 right-3 flex cursor-pointer items-center">
                  {searchQuery ? (
                    <XIcon size={12} weight="bold" onClick={onSearchClear} />
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
            </div>
          ) : (
            <div className="flex w-10/12 items-center justify-center md:w-11/12 lg:w-1/3">
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
            </div>
          )}
        </>
      )}
      <div />
    </div>
  );
};

export default Header;
