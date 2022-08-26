import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlass } from "phosphor-react";

const Search = ({
  searchCallBack
}) => {
  const [searchParams] = useSearchParams();
  const [searchValue, setValue] = useState<string>(
    searchParams.get("q[first_name_or_last_name_or_email_cont]") || ""
  );

  const handleChange = async (e: any) => {
    setValue(e.target.value);
  };

  const handleSearchSubmit = async () => {
    searchCallBack(searchValue);
  };

  return (
    <div>
      <div style={{
        position: "relative"
      }}>
        <input role="combobox" aria-autocomplete="list" aria-expanded="false" autoComplete="off" value={searchValue} onMouseEnter={handleChange} onChange={handleChange} onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()} />
      </div>
      <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => handleSearchSubmit()}>
        <MagnifyingGlass size={12} />
      </button>
    </div>
  );
};

export default Search;
