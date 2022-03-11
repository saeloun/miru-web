import * as React from "react";
import { Funnel, MagnifyingGlass, Plus } from "phosphor-react";

const Header = () => {
  return (
    <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
      <h2 className="header__title">
        Invoices
      </h2>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper">
          <input
            type="search"
            className="header__searchInput"
            placeholder="Search"
          />
          <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
            <MagnifyingGlass size={9} />
          </button>
        </div>
        <button className="ml-7">
          <Funnel size={13} />
        </button>
      </div>
      <div className="flex">
        <button
          type="button"
          className="header__button"
        >
          <Plus weight="fill" size={12} />
          <span className="ml-2 inline-block">NEW INVOICE</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
