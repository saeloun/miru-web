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
    <div className="relative mx-auto w-11/12 rounded-full md:w-1/2 lg:w-1/3">
      <input
        className="outline-none w-full rounded-full border-miru-gray-1000 bg-miru-gray-100 py-2 px-3 text-sm font-medium leading-5 focus:border focus:ring-1 focus:ring-miru-gray-1000"
        id="searchInput"
        placeholder="Search"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
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
  searchAction: (val) => any; // eslint-disable-line
  SearchDataRow;
}

export default AutoSearch;
