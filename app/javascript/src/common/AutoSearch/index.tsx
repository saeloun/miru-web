import React, { useEffect, useState } from "react";

import { useDebounce } from "helpers";
import { SearchIcon, XIcon } from "miruIcons";

import SearchDropdown from "./SearchDropdown";

const AutoSearch = ({ searchAction, SearchDataRow }: Iprops) => {
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
    <div className="header__searchWrap w-10/12 rounded-full border py-2 md:w-1/2 lg:w-1/3">
      <div className="relative mx-auto w-11/12 rounded">
        <div>
          <input
            className="outline-none w-full px-2 text-sm font-medium leading-5"
            id="searchInput"
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
            SearchedDataRow={SearchDataRow}
            list={searchResult}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

interface Iprops {
  searchAction: (val) => any; // eslint-disable-line
  SearchDataRow;
}

export default AutoSearch;
