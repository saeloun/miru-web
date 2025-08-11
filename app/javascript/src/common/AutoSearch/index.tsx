import React, { useEffect, useState } from "react";

import classNames from "classnames";
import { useDebounce } from "helpers";
import { SearchIcon, XIcon } from "miruIcons";

import SearchDropdown from "./SearchDropdown";

const AutoSearch = ({
  searchAction,
  SearchDataRow,
  wrapperClassName,
  handleEnter,
  clearSearch,
}: Iprops) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const defaultWrapperClassName =
    "relative w-full rounded-full md:w-1/2 lg:w-1/3";

  const handleSearchAction = async () => {
    if (searchQuery) {
      const result = await searchAction(debouncedSearchQuery);
      setSearchResult(result);
      setLoading(false);
    } else {
      setSearchResult([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    handleSearchAction();
  }, [debouncedSearchQuery]);

  const onSearchClear = () => {
    setSearchQuery("");
    clearSearch();
  };

  return (
    <div className={classNames(defaultWrapperClassName, wrapperClassName)}>
      <input
        className="outline-none w-full rounded-full border-miru-gray-1000 bg-miru-gray-100 py-2 px-3 text-sm font-medium leading-5 focus:border focus:ring-1 focus:ring-miru-gray-1000"
        id="searchInput"
        placeholder="Search"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onKeyDown={e => handleEnter(debouncedSearchQuery, e.key === "Enter")}
      />
      <button className=" absolute inset-y-0 right-3 flex cursor-pointer items-center pr-3 ">
        {searchQuery ? (
          <XIcon size={12} onClick={onSearchClear} />
        ) : (
          <SearchIcon className="text-miru-gray-1000" size={16} weight="bold" />
        )}
      </button>
      <SearchDropdown
        SearchedDataRow={SearchDataRow}
        list={searchResult}
        loading={loading}
      />
    </div>
  );
};

interface Iprops {
  searchAction: (val) => any;
  SearchDataRow;
  wrapperClassName?: string;
  handleEnter?: (val, shouldUpdate) => any;
  clearSearch?: () => any;
}

export default AutoSearch;
