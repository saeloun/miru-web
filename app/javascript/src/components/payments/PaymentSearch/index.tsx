import React, { useEffect, useState } from "react";

import { useDebounce } from "helpers";
import { SearchIcon, XIcon } from "miruIcons";

import SearchDropdown from "./SearchDropdown";

import { SearchProps } from "../interfaces";

const SearchWithSuggestions = ({
  searchList,
  searchAction,
  params,
  setParams,
  showSearchedPayments,
  setShowSearchedPayments,
}: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestedPayments, setSuggestedPayments] = useState([]);
  const [isClickedOnSearchOrSuggestion, setIsClickedOnSearchOrSuggestion] =
    useState<boolean>(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const onKeydownHandler = e => {
    if (e?.key?.trim()?.toLowerCase() === "enter") {
      searchAction(searchQuery);
      setParams({ ...params, query: searchQuery });
    }
  };

  const onSearchClear = () => {
    resetSearchState();
  };

  const handleSearch = (debouncedSearchQuery: string) => {
    if (debouncedSearchQuery) {
      searchAction(debouncedSearchQuery);
      setSearchQuery(debouncedSearchQuery);
      setParams({ ...params, query: searchQuery });
    } else {
      resetSearchState();
    }
    setIsClickedOnSearchOrSuggestion(false);
  };

  const handleSearchInputChange = e => {
    const value = e.target.value;
    setSearchQuery(e.target.value);
    if (!value) {
      resetSearchState();
    }
  };

  const resetSearchState = () => {
    setSearchQuery("");
    setParams({ ...params, query: "" });
    setShowSearchedPayments(false);
  };

  const getSuggestedItems = () => {
    const temp = {};
    const tempFilteredList = searchList?.filter(payment => {
      const clientName = payment.clientName?.trim()?.toLowerCase();
      if (!temp[clientName]) {
        temp[clientName] = true;

        return payment?.clientName
          ?.toLowerCase()
          .trim()
          ?.startsWith(searchQuery?.toLowerCase().trim());
      }
    });

    setSuggestedPayments(tempFilteredList);
  };

  useEffect(() => {
    if (isClickedOnSearchOrSuggestion) {
      handleSearch(debouncedSearchQuery);
    }
  }, [searchQuery, isClickedOnSearchOrSuggestion]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      getSuggestedItems();
    }
  }, [debouncedSearchQuery]);

  return (
    <div className="header__searchWrap w-10/12 rounded-full border py-2">
      <div className="relative mx-auto w-11/12 rounded">
        <div>
          <input
            className="outline-none w-full px-2 text-sm font-medium leading-5"
            placeholder="Search"
            type="text"
            value={searchQuery || params?.query?.trim()}
            onChange={handleSearchInputChange}
            onKeyDown={e => onKeydownHandler(e)}
          />
          <button className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2 ">
            {showSearchedPayments ? (
              <XIcon size={12} weight="bold" onClick={onSearchClear} />
            ) : (
              <SearchIcon
                size={12}
                onClick={() => {
                  setIsClickedOnSearchOrSuggestion(true);
                  handleSearch(debouncedSearchQuery);
                }}
              />
            )}
          </button>
          {debouncedSearchQuery?.trim() &&
          debouncedSearchQuery?.trim() !== params?.query?.trim() ? (
            <SearchDropdown
              list={suggestedPayments}
              setSearchQuery={setSearchQuery}
              setIsClickedOnSearchOrSuggestion={
                setIsClickedOnSearchOrSuggestion
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchWithSuggestions;
