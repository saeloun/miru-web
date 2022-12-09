import React from "react";

const SearchDropdown = ({ list = [], SearchedDataRow, loading }) => {
  if (!loading && list.length == 0) {
    return (
      <section className="absolute top-8 flex w-full items-center bg-miru-white-1000 py-2 shadow drop-shadow-md">
        <div className="mx-auto text-center">No results found</div>
      </section>
    );
  }

  return (
    <section className="absolute top-9 w-full rounded-lg bg-miru-white-1000 shadow drop-shadow-md">
      {list?.map((item, index) => (
        <SearchedDataRow item={item} key={index} />
      ))}
    </section>
  );
};

export default SearchDropdown;
