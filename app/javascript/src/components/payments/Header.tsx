import React from "react";

import { PlusIcon } from "miruIcons";

const Header = ({ setShowManualEntryModal }) => (
  <div className="mt-6 mb-3 justify-between sm:flex sm:items-center">
    <div className="flex">
      <h2 className="header__title">Payments</h2>
      {/* <div className="header__searchWrap ml-12">
        <div className="header__searchInnerWrapper">
          <input
            type="search"
            className="header__searchInput"
            placeholder="Search"
          />

          <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
            <SearchIcon size={12} />
          </button>
        </div>
      </div> */}
    </div>
    <div className="flex">
      <button
        className="header__button"
        type="button"
        onClick={() => setShowManualEntryModal(true)}
      >
        <PlusIcon size={16} weight="fill" />
        <span className="ml-2 inline-block">ADD MANUAL ENTRY</span>
      </button>
    </div>
  </div>
);

export default Header;
