import React, { useCallback, useEffect, useState } from "react";

import classNames from "classnames";
import { useDebounce } from "helpers";
import { SearchIcon, XIcon } from "miruIcons";
import { Input } from "../../components/ui/input";

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

  const defaultWrapperClassName = "relative w-full md:w-1/2 lg:w-1/3";

  const handleSearchAction = useCallback(async () => {
    if (searchQuery) {
      const result = await searchAction(debouncedSearchQuery);
      setSearchResult(result);
      setLoading(false);
    } else {
      setSearchResult([]);
    }
  }, [searchQuery, debouncedSearchQuery, searchAction]);

  useEffect(() => {
    setLoading(true);
    handleSearchAction();
  }, [debouncedSearchQuery, handleSearchAction]);

  const onSearchClear = () => {
    setSearchQuery("");
    clearSearch();
  };

  return (
    <div className={classNames(defaultWrapperClassName, wrapperClassName)}>
      <div className="relative">
        <Input
          className="pr-10"
          id="searchInput"
          placeholder="Search"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => handleEnter(debouncedSearchQuery, e.key === "Enter")}
        />
        <button className="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center rounded-r-md transition-colors hover:bg-muted">
          {searchQuery ? (
            <XIcon
              className="text-muted-foreground hover:text-foreground"
              size={16}
              onClick={onSearchClear}
            />
          ) : (
            <SearchIcon
              className="text-muted-foreground"
              size={16}
              weight="bold"
            />
          )}
        </button>
      </div>
      <SearchDropdown
        SearchedDataRow={SearchDataRow}
        list={searchResult}
        loading={loading}
      />
    </div>
  );
};

interface Iprops {
  searchAction: (_val) => any;
  SearchDataRow;
  wrapperClassName?: string;
  handleEnter?: (_val, _shouldUpdate) => any;
  clearSearch?: () => any;
}

export default AutoSearch;
