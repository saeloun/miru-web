import React from "react";
import { MagnifyingGlass } from "phosphor-react";

const Header = () => (
  <div className="mt-6 mb-3 sm:flex sm:items-center ">
    <h2 className="header__title">Payments</h2>
    <div className="header__searchWrap ml-12">
      <div className="header__searchInnerWrapper">
        <input
          type="search"
          className="header__searchInput"
          placeholder="Search"
        />

        <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
          <MagnifyingGlass size={12} />
        </button>
      </div>
    </div>
  </div>
);

export default Header;
