import React, { useEffect, useState } from "react";

import { useDebounce } from "helpers";
import { SearchIcon, XIcon } from "miruIcons";

import SearchDropdown from "./SearchDropdown";

const AutoSearch = ({ searchAction, searchDataRow }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
  };

  return (
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
          />
          <button className=" absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 ">
            {searchQuery ? (
              <XIcon size={12} onClick={onSearchClear} />
            ) : (
              <SearchIcon size={12} />
            )}
          </button>
          <SearchDropdown
            SearchedDataRow={searchDataRow}
            list={searchResult}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AutoSearch;
